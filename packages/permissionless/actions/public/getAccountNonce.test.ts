import { http, createPublicClient } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getSimpleAccountClient } from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { getAccountNonce } from "./getAccountNonce"

describe("getAccountNonce", () => {
    testWithRpc("getAccountNonce_V06", async ({ rpc }) => {
        const { anvilRpc, altoRpc } = rpc

        const client = createPublicClient({
            transport: http(anvilRpc)
        })

        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
        })

        const nonce = await getAccountNonce(client, {
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            sender: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
    testWithRpc("getAccountNonce_V07", async ({ rpc }) => {
        const { anvilRpc, altoRpc } = rpc

        const client = createPublicClient({
            transport: http(anvilRpc)
        })

        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
        })

        const nonce = await getAccountNonce(client, {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            sender: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
})
