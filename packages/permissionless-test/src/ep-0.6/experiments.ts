import {
    ENTRYPOINT_ADDRESS_V06,
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

        const smartAccount = await privateKeyToSafeSmartAccount(publicClient, {
            safeVersion: "1.4.1",
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey: generatePrivateKey()
        })
        const ALTO_RPC = "http://localhost:4337"

        const paymasterClient = getPimlicoPaymasterClient(
            ENTRYPOINT_ADDRESS_V06
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
        }).extend(
            paymasterActionsEip7677({ entryPoint: ENTRYPOINT_ADDRESS_V06 })
        )

        const response = await eip7677Client.getPaymasterData({
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
