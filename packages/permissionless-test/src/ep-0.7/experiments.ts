import {
    ENTRYPOINT_ADDRESS_V07,
    createSmartAccountClient
} from "permissionless"
import { privateKeyToSafeSmartAccount } from "permissionless/accounts"
import { paymasterActionsEip7677 } from "permissionless/experimental"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import { http, createClient, zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, test } from "vitest"
import type { AAParamType } from "../types"
import {
    PAYMASTER_RPC,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSafeClient
} from "../utils"
import { privateKeyToSimpleSmartAccount } from "permissionless/_types/accounts"
import { SIMPLE_ACCOUNT_FACTORY_V07 } from "../constants"

describe.each([
    {
        name: "Eip 7677 client",

        getSmartAccountClient: async (
            conf: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
        ) => getSafeClient(conf)
    }
])("$name test", ({ name, getSmartAccountClient }) => {
    test("Can get stab data", async () => {
        const publicClient = getPublicClient()

        const smartAccount = await privateKeyToSimpleSmartAccount(
            publicClient,
            {
                factoryAddress: SIMPLE_ACCOUNT_FACTORY_V07,
                entryPoint: ENTRYPOINT_ADDRESS_V07,
                privateKey: generatePrivateKey()
            }
        )
        const ALTO_RPC = "http://localhost:4337"

        const paymasterClient = getPimlicoPaymasterClient(
            ENTRYPOINT_ADDRESS_V07
        )

        const smartAccountClient = createSmartAccountClient({
            chain: foundry,
            account: smartAccount,
            bundlerTransport: http(ALTO_RPC)
        })

        const userOperaton =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const eip7677Client = createClient({
            chain: foundry,
            transport: http(PAYMASTER_RPC)
        }).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V07))

        await eip7677Client.getPaymasterData({
            userOperation: {
                ...userOperaton,
                paymasterVerificationGasLimit: 0n,
                paymasterPostOpGasLimit: 0n
            }
        })

        await eip7677Client.getPaymasterStubData({
            userOperation: userOperaton
        })

        // await eip7677Client.getPaymasterStubData({
        //     userOperation: await smartClient.prepareUserOperationRequest({
        //         userOperation: {
        //             callData: await smartClient.account.encodeCallData({
        //                 to: zeroAddress,
        //                 value: 0n,
        //                 data: "0x"
        //             })
        //         }
        //     })
        // })
    })
})
