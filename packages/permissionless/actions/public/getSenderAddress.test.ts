import { http, createPublicClient } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getSimpleAccountClient } from "../../../permissionless-test/src/utils"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "../../_types/types"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { getSenderAddress } from "./getSenderAddress"

describe("getSenderAddress", () => {
    testWithRpc("getSenderAddress_V06", async ({ rpc }) => {
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

        const address = await getSenderAddress(client, {
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            initCode: await simpleAccountClient.account.getInitCode()
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
    testWithRpc("getSenderAddress_V06_error", async ({ rpc }) => {
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

        await expect(async () =>
            getSenderAddress(client, {
                entryPoint:
                    "0x0000000000000000000000000000000000000000" as ENTRYPOINT_ADDRESS_V06_TYPE,
                initCode: await simpleAccountClient.account.getInitCode()
            })
        ).rejects.toThrowError(/not a valid entry point/)
    })
    testWithRpc("getSenderAddress_V07", async ({ rpc }) => {
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

        const factory = await simpleAccountClient.account.getFactory()
        const factoryData = await simpleAccountClient.account.getFactoryData()

        if (!factory || !factoryData) {
            throw new Error("Factory or factoryData not found")
        }

        const address = await getSenderAddress(client, {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            factory,
            factoryData
        })

        expect(address).toBe(simpleAccountClient.account.address)
    })
})
