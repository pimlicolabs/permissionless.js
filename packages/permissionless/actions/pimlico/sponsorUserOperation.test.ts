import { isHash, zeroAddress } from "viem"
import {
    type UserOperation,
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { sponsorUserOperation } from "./sponsorUserOperation"

describe("sponsorUserOperation", () => {
    testWithRpc("sponsorUserOperation_V06", async ({ rpc }) => {
        const { altoRpc, paymasterRpc } = rpc

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

        const preparedUserOp = await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const paymasterClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: paymasterRpc
        })

        const sponsorResult = await sponsorUserOperation(paymasterClient, {
            userOperation: preparedUserOp,
            entryPoint: {
                address: entryPoint06Address,
                version: "0.6"
            }
        })

        const finalUserOp = {
            ...preparedUserOp,
            ...sponsorResult
        }
        const account = simpleAccountClient.account
        finalUserOp.signature = await account.signUserOperation(finalUserOp)

        const opHash = await simpleAccountClient.sendUserOperation(finalUserOp)

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
        const { altoRpc, paymasterRpc } = rpc

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

        const preparedUserOp = await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const paymasterClient = getPimlicoClient({
            entryPointVersion: "0.7",
            altoRpc: paymasterRpc
        })

        const sponsorResult = await sponsorUserOperation(paymasterClient, {
            userOperation: preparedUserOp,
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        })

        const finalUserOp = {
            ...preparedUserOp,
            ...sponsorResult
        }
        const account = simpleAccountClient.account
        finalUserOp.signature = await account.signUserOperation(finalUserOp)

        const opHash = await simpleAccountClient.sendUserOperation(finalUserOp)

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

    testWithRpc("sponsorUserOperation_V08", async ({ rpc }) => {
        const { altoRpc, paymasterRpc } = rpc

        const bundlerClient = getPimlicoClient({
            entryPointVersion: "0.8",
            altoRpc: altoRpc
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

        const preparedUserOp = (await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })) as UserOperation<"0.8">

        const paymasterClient = getPimlicoClient({
            entryPointVersion: "0.8",
            altoRpc: paymasterRpc
        })

        const sponsorResult = await sponsorUserOperation(paymasterClient, {
            userOperation: preparedUserOp,
            entryPoint: {
                address: entryPoint08Address,
                version: "0.8"
            }
        })

        const finalUserOp = {
            ...preparedUserOp,
            ...sponsorResult
        }
        const account = simpleAccountClient.account
        finalUserOp.signature = await account.signUserOperation(finalUserOp)

        const opHash = await simpleAccountClient.sendUserOperation(finalUserOp)

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
