import { http, createPublicClient } from "viem"
import {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { getAccountNonce } from "./getAccountNonce"

describe("getAccountNonce", () => {
    testWithRpc("getAccountNonce_V06", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const client = createPublicClient({
            transport: http(anvilRpc)
        })

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleAccountClient({
                ...rpc,
                entryPoint: {
                    version: "0.6"
                }
            }),
            entryPoint: {
                version: "0.6"
            },
            ...rpc
        })

        const nonce = await getAccountNonce(client, {
            entryPointAddress: entryPoint06Address,
            address: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
    testWithRpc("getAccountNonce_V07", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const client = createPublicClient({
            transport: http(anvilRpc)
        })

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleAccountClient({
                ...rpc,
                entryPoint: {
                    version: "0.7"
                }
            }),
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        const nonce = await getAccountNonce(client, {
            entryPointAddress: entryPoint07Address,
            address: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
})
