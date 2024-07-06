import { http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import { getPublicClient } from "../../permissionless-test/src/utils"
import { signerToSimpleSmartAccount } from "../accounts"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../utils"
import { createSmartAccountClient } from "./createSmartAccountClient"

describe("createSmartAccountClient", () => {
    testWithRpc("createSmartAccountClient_V06", async ({ rpc }) => {
        const publicClient = getPublicClient(rpc.anvilRpc)

        const simpleSmartAccount = await signerToSimpleSmartAccount(
            publicClient,
            {
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                signer: privateKeyToAccount(generatePrivateKey())
            }
        )

        const smartAccountClient = createSmartAccountClient({
            chain: foundry,
            account: simpleSmartAccount,
            bundlerTransport: http(rpc.altoRpc)
        })

        expect(smartAccountClient.account.address).toBe(
            simpleSmartAccount.address
        )
    })

    testWithRpc("createSmartAccountClient_V07", async ({ rpc }) => {
        const publicClient = getPublicClient(rpc.anvilRpc)

        const simpleSmartAccount = await signerToSimpleSmartAccount(
            publicClient,
            {
                entryPoint: ENTRYPOINT_ADDRESS_V07,
                signer: privateKeyToAccount(generatePrivateKey())
            }
        )

        const smartAccountClient = createSmartAccountClient({
            chain: foundry,
            account: simpleSmartAccount,
            bundlerTransport: http(rpc.altoRpc)
        })

        expect(smartAccountClient.account.address).toBe(
            simpleSmartAccount.address
        )
    })
})
