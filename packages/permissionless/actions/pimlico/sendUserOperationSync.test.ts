import { zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import {
    SendUserOperationSyncError,
    sendUserOperationSync
} from "./sendUserOperationSync"

describe.each(["0.7", "0.8"] as const)(
    "sendUserOperationSync %s",
    (version) => {
        testWithRpc("returns the receipt", async ({ rpc }) => {
            const smartAccountClient = getBundlerClient({
                account: await getSimpleAccountClient({
                    ...rpc,
                    entryPoint: { version }
                }),
                entryPoint: { version },
                ...rpc
            })

            const receipt = await sendUserOperationSync(smartAccountClient, {
                calls: [{ to: zeroAddress, data: "0x", value: 0n }]
            })

            expect(receipt.success).toBe(true)
            expect(receipt.sender).toBe(smartAccountClient.account.address)

            const fetched = await smartAccountClient.getUserOperationReceipt({
                hash: receipt.userOpHash
            })
            expect(fetched.receipt.transactionHash).toBe(
                receipt.receipt.transactionHash
            )
        })

        testWithRpc("throws rejected on an invalid nonce", async ({ rpc }) => {
            const smartAccountClient = getBundlerClient({
                account: await getSimpleAccountClient({
                    ...rpc,
                    entryPoint: { version }
                }),
                entryPoint: { version },
                ...rpc
            })

            const error = await sendUserOperationSync(smartAccountClient, {
                calls: [{ to: zeroAddress, data: "0x", value: 0n }],
                nonce: 5n,
                // Skip estimation so the bundler, not the estimator, rejects it.
                callGasLimit: 100_000n,
                verificationGasLimit: 500_000n,
                preVerificationGas: 100_000n
            }).catch((e) => e)

            expect(error).toBeInstanceOf(SendUserOperationSyncError)
            expect(error.kind).toBe("rejected")
            expect(error.canResend).toBe(false)
        })

        testWithRpc(
            "throws execution_reverted when the call reverts",
            async ({ rpc }) => {
                const smartAccountClient = getBundlerClient({
                    account: await getSimpleAccountClient({
                        ...rpc,
                        entryPoint: { version }
                    }),
                    entryPoint: { version },
                    ...rpc
                })
                const reverting = {
                    // The EntryPoint has no fallback, so unknown selectors revert.
                    calls: [
                        {
                            to: smartAccountClient.account.entryPoint.address,
                            data: "0xdeadbeef" as const,
                            value: 0n
                        }
                    ],
                    // Skip estimation, which would fail on the revert.
                    callGasLimit: 100_000n,
                    verificationGasLimit: 1_000_000n,
                    preVerificationGas: 100_000n
                }

                const error = await sendUserOperationSync(
                    smartAccountClient,
                    reverting
                ).catch((e) => e)

                expect(error).toBeInstanceOf(SendUserOperationSyncError)
                expect(error.kind).toBe("execution_reverted")
                expect(error.canResend).toBe(false)
                expect(error.receipt.success).toBe(false)

                const receipt = await sendUserOperationSync(
                    smartAccountClient,
                    { ...reverting, throwOnReceiptRevert: false }
                )
                expect(receipt.success).toBe(false)
            }
        )

        testWithRpc("throws pending past the deadline", async ({ rpc }) => {
            const smartAccountClient = getBundlerClient({
                account: await getSimpleAccountClient({
                    ...rpc,
                    entryPoint: { version }
                }),
                entryPoint: { version },
                ...rpc
            })

            const error = await sendUserOperationSync(smartAccountClient, {
                calls: [{ to: zeroAddress, data: "0x", value: 0n }],
                timeout: 1
            }).catch((e) => e)

            expect(error).toBeInstanceOf(SendUserOperationSyncError)
            expect(error.kind).toBe("pending")
            expect(error.canResend).toBe(false)
        })
    }
)
