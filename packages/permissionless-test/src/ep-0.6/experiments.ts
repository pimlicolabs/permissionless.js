import {
    ENTRYPOINT_ADDRESS_V06,
    createSmartAccountClient
} from "permissionless"
import { privateKeyToSafeSmartAccount } from "permissionless/accounts"
import type { Eip7677Client } from "permissionless/experimental"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import { http, type Chain, zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { foundry } from "viem/chains"
import { beforeAll, describe, test } from "vitest"
import type { AAParamType } from "../types"
import {
    getEip7677Client,
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
    let eip7677Client: Eip7677Client<ENTRYPOINT_ADDRESS_V06_TYPE, Chain>

    beforeAll(async () => {
        eip7677Client = await getEip7677Client({
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })
    })

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
            bundlerTransport: http(ALTO_RPC),
            eip7677Client: eip7677Client
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
