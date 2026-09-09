import { EntryPoint } from "viem/erc4337"
import { describe, expect } from "vitest"
import { getSimpleClient } from "../../../permissionless-test/src/accounts/simple"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { getAccountNonce } from "./getAccountNonce"

describe("getAccountNonce", () => {
    testWithRpc("getAccountNonce_V06", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const client = getPublicClient(anvilRpc)

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleClient({
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
            entryPointAddress: EntryPoint.addressV06,
            address: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
    testWithRpc("getAccountNonce_V07", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const client = getPublicClient(anvilRpc)

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleClient({
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
            entryPointAddress: EntryPoint.addressV07,
            address: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
    testWithRpc("getAccountNonce_V08", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const client = getPublicClient(anvilRpc)

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleClient({
                ...rpc,
                entryPoint: {
                    version: "0.8"
                }
            }),
            entryPoint: {
                version: "0.8"
            },
            ...rpc
        })

        const nonce = await getAccountNonce(client, {
            entryPointAddress: EntryPoint.addressV08,
            address: simpleAccountClient.account.address
        })

        expect(nonce).toBe(0n)
    })
})
