import { EntryPoint } from "viem/erc4337"
import { Hex } from "viem/utils"
import { describe, expect } from "vitest"
import { getSimpleClient } from "../../../permissionless-test/src/accounts/simple"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { getSenderAddress } from "./getSenderAddress"

describe("getSenderAddress", () => {
    testWithRpc("getSenderAddress_V06", async ({ rpc }) => {
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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw new Error("Init code not found")
        }

        const address = await getSenderAddress(client, {
            entryPointAddress: EntryPoint.addressV06,
            initCode: Hex.concat(factory, factoryData)
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
    testWithRpc("getSenderAddress_V06_error", async ({ rpc }) => {
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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw new Error("Init code not found")
        }

        await expect(async () =>
            getSenderAddress(client, {
                entryPointAddress: "0x0000000000000000000000000000000000000000",
                initCode: Hex.concat(factory, factoryData)
            })
        ).rejects.toThrowError()
    })
    testWithRpc("getSenderAddress_V07", async ({ rpc }) => {
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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw new Error("Factory or factoryData not found")
        }

        const address = await getSenderAddress(client, {
            entryPointAddress: EntryPoint.addressV07,
            factory,
            factoryData
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
    testWithRpc("getSenderAddress_V08", async ({ rpc }) => {
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

        const { factory, factoryData } =
            await simpleAccountClient.account.getFactoryArgs()

        if (!factory || !factoryData) {
            throw new Error("Factory or factoryData not found")
        }

        const address = await getSenderAddress(client, {
            entryPointAddress: EntryPoint.addressV08,
            factory,
            factoryData
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
})
