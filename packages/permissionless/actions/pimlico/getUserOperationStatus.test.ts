import { isHash, zeroAddress } from "viem"
import { entryPoint06Address } from "viem/account-abstraction"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { getUserOperationStatus } from "./getUserOperationStatus"

describe("getUserOperationStatus", () => {
    testWithRpc("getUserOperationStatus_V06", async ({ rpc }) => {
        const { altoRpc } = rpc

        const bundlerClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: altoRpc
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

        const opHash = await simpleAccountClient.sendUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        expect(isHash(opHash)).toBe(true)

        const userOperationReceipt =
            await bundlerClient.waitForUserOperationReceipt({
                hash: opHash,
                timeout: 100000
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.getUserOperationReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
        const userOperationStatus = await getUserOperationStatus(
            bundlerClient,
            {
                hash: opHash
            }
        )
        expect(userOperationStatus).not.toBeNull()
        expect(userOperationStatus).not.toBeUndefined()
        expect(userOperationStatus.status).toBe("included")
        expect(userOperationStatus.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
    })

    testWithRpc("getUserOperationStatus_V07", async ({ rpc }) => {
        const { altoRpc } = rpc

        const bundlerClient = getPimlicoClient({
            entryPointVersion: "0.7",
            altoRpc: altoRpc
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

        const opHash = await simpleAccountClient.sendUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        expect(isHash(opHash)).toBe(true)

        const userOperationReceipt =
            await bundlerClient.waitForUserOperationReceipt({
                hash: opHash,
                timeout: 100000
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.getUserOperationReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
        const userOperationStatus = await getUserOperationStatus(
            bundlerClient,
            {
                hash: opHash
            }
        )
        expect(userOperationStatus).not.toBeNull()
        expect(userOperationStatus).not.toBeUndefined()
        expect(userOperationStatus.status).toBe("included")
        expect(userOperationStatus.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
    })
})
