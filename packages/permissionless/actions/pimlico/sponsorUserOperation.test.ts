import { isHash, zeroAddress } from "viem"
import { entryPoint06Address } from "viem/account-abstraction"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"

describe("sponsorUserOperation", () => {
    testWithRpc("sponsorUserOperation_V06", async ({ rpc }) => {
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
    })

    testWithRpc("sponsorUserOperation_V07", async ({ rpc }) => {
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
    })
})
