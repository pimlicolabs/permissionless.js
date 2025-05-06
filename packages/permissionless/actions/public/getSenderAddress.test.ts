import { http, concatHex, createPublicClient } from "viem"
import {
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { getSenderAddress } from "./getSenderAddress"

describe("getSenderAddress", () => {
    testWithRpc("getSenderAddress_V06", async ({ rpc }) => {
        const { anvilRpc, altoRpc } = rpc

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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw Error("Init code not found")
        }

        const address = await getSenderAddress(client, {
            entryPointAddress: entryPoint06Address,
            initCode: concatHex([factory, factoryData])
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
    testWithRpc("getSenderAddress_V06_error", async ({ rpc }) => {
        const { anvilRpc, altoRpc } = rpc

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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw Error("Init code not found")
        }

        await expect(async () =>
            getSenderAddress(client, {
                entryPointAddress: "0x0000000000000000000000000000000000000000",
                initCode: concatHex([factory, factoryData])
            })
        ).rejects.toThrowError()
    })
    testWithRpc("getSenderAddress_V07", async ({ rpc }) => {
        const { anvilRpc, altoRpc } = rpc

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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw new Error("Factory or factoryData not found")
        }

        const address = await getSenderAddress(client, {
            entryPointAddress: entryPoint07Address,
            factory,
            factoryData
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
    testWithRpc("getSenderAddress_V08", async ({ rpc }) => {
        const { anvilRpc, altoRpc } = rpc

        const client = createPublicClient({
            transport: http(anvilRpc)
        })

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleAccountClient({
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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw new Error("Factory or factoryData not found")
        }

        const address = await getSenderAddress(client, {
            entryPointAddress: entryPoint08Address,
            factory,
            factoryData
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
})
