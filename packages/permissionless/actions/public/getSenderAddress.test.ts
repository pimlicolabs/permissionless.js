import { EntryPoint } from "viem/erc4337"
import { Hex } from "viem/utils"
import { describe, expect, test } from "vitest"
import { getSimpleClient } from "../../../permissionless-test/src/accounts/simple"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import {
    InitCodeRequiredError,
    InvalidEntryPointError,
    SenderAddressNotFoundError
} from "../../errors/entryPoint"
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
        ).rejects.toThrow(InvalidEntryPointError)
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

describe("getSenderAddress errors", () => {
    test("rejects with InitCodeRequiredError without init code", async () => {
        await expect(
            getSenderAddress(
                {} as any,
                {
                    entryPointAddress: EntryPoint.addressV07
                } as any
            )
        ).rejects.toThrow(InitCodeRequiredError)
    })

    test("rejects with SenderAddressNotFoundError on an empty result", async () => {
        const client = { request: async () => "0x", call: async () => ({}) }
        await expect(
            getSenderAddress(client as any, {
                entryPointAddress: EntryPoint.addressV07,
                initCode: "0x"
            })
        ).rejects.toThrow(SenderAddressNotFoundError)
    })
})
