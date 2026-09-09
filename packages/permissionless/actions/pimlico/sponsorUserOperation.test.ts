import { EntryPoint, type UserOperation } from "viem/erc4337"
import { Address } from "viem/utils"
import { describe, expect } from "vitest"
import { getSimpleClient } from "../../../permissionless-test/src/accounts/simple"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient
} from "../../../permissionless-test/src/utils"
import {
    type SponsorUserOperationReturnType,
    sponsorUserOperation
} from "./sponsorUserOperation"

describe("sponsorUserOperation", () => {
    testWithRpc("sponsorUserOperation_V06", async ({ rpc }) => {
        const { altoRpc, paymasterRpc } = rpc

        const bundlerClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: altoRpc
        })

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

        const preparedUserOp = await simpleAccountClient.userOperation.prepare({
            calls: [
                {
                    to: Address.zero,
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
                address: EntryPoint.addressV06,
                version: "0.6"
            }
        })

        const finalUserOp = {
            ...preparedUserOp,
            ...sponsorResult
        }
        const account = simpleAccountClient.account
        finalUserOp.signature = await account.signUserOperation(finalUserOp)

        const opHash = await simpleAccountClient.userOperation.send(finalUserOp)

        expect(opHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

        const userOperationReceipt =
            await bundlerClient.userOperation.waitForReceipt({
                hash: opHash,
                timeout: 100000
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.userOperation.getReceipt({
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

        const preparedUserOp = await simpleAccountClient.userOperation.prepare({
            calls: [
                {
                    to: Address.zero,
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
                address: EntryPoint.addressV07,
                version: "0.7"
            }
        })

        const finalUserOp = {
            ...preparedUserOp,
            ...sponsorResult
        }
        const account = simpleAccountClient.account
        finalUserOp.signature = await account.signUserOperation(finalUserOp)

        const opHash = await simpleAccountClient.userOperation.send(finalUserOp)

        expect(opHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

        const userOperationReceipt =
            await bundlerClient.userOperation.waitForReceipt({
                hash: opHash,
                timeout: 100000
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.userOperation.getReceipt({
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

        const preparedUserOp = (await simpleAccountClient.userOperation.prepare(
            {
                calls: [
                    {
                        to: Address.zero,
                        data: "0x",
                        value: 0n
                    }
                ]
            }
        )) as UserOperation.UserOperation<"0.8">

        const paymasterClient = getPimlicoClient({
            entryPointVersion: "0.8",
            altoRpc: paymasterRpc
        })

        const sponsorResult = (await sponsorUserOperation(paymasterClient, {
            userOperation: preparedUserOp,
            entryPoint: {
                address: EntryPoint.addressV08,
                version: "0.8"
            }
        } as any)) as SponsorUserOperationReturnType<"0.7">

        const finalUserOp = {
            ...preparedUserOp,
            ...sponsorResult
        }
        const account = simpleAccountClient.account
        finalUserOp.signature = await account.signUserOperation(finalUserOp)

        const opHash = await simpleAccountClient.userOperation.send(finalUserOp)

        expect(opHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

        const userOperationReceipt =
            await bundlerClient.userOperation.waitForReceipt({
                hash: opHash,
                timeout: 100000
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.userOperation.getReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
    })
})
