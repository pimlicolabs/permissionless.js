import { http, RpcRequestError, custom, zeroAddress } from "viem"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { createSmartAccountClient } from "../../clients/createSmartAccountClient"
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
            "returns the receipt when the call reverts",
            async ({ rpc }) => {
                const smartAccountClient = getBundlerClient({
                    account: await getSimpleAccountClient({
                        ...rpc,
                        entryPoint: { version }
                    }),
                    entryPoint: { version },
                    ...rpc
                })
                const receipt = await sendUserOperationSync(
                    smartAccountClient,
                    {
                        // The EntryPoint has no fallback, so unknown selectors revert.
                        calls: [
                            {
                                to: smartAccountClient.account.entryPoint
                                    .address,
                                data: "0xdeadbeef",
                                value: 0n
                            }
                        ],
                        // Skip estimation, which would fail on the revert.
                        callGasLimit: 100_000n,
                        verificationGasLimit: 1_000_000n,
                        preVerificationGas: 100_000n
                    }
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

        // Responses the local bundler can't produce on demand.
        testWithRpc.for([
            {
                error: {
                    code: -32521,
                    message: "bundle transaction 0xabc reverted onchain",
                    data: { transactionHash: `0x${"ab".repeat(32)}` }
                },
                kind: "bundle_reverted",
                canResend: true,
                message: "bundle transaction 0xabc reverted onchain"
            },
            {
                error: {
                    code: -32602,
                    message:
                        "userOperation was submitted but is not yet included",
                    data: { transactionHash: `0x${"ab".repeat(32)}` }
                },
                kind: "pending",
                canResend: false
            },
            {
                error: { code: -32603, message: "internal error" },
                kind: "not_found",
                canResend: true
            }
        ])(
            "maps $error.code to $kind",
            async ({ error, kind, canResend, message }, { rpc }) => {
                const alto = http(rpc.altoRpc)({ chain: foundry })
                const smartAccountClient = createSmartAccountClient({
                    client: getPublicClient(rpc.anvilRpc),
                    chain: foundry,
                    account: await getSimpleAccountClient({
                        ...rpc,
                        entryPoint: { version }
                    }),
                    pollingInterval: 100,
                    bundlerTransport: custom({
                        async request({ method, params }) {
                            if (method === "pimlico_sendUserOperationNow") {
                                throw new RpcRequestError({
                                    body: {},
                                    error,
                                    url: rpc.altoRpc
                                })
                            }
                            return alto.request({ method, params } as never)
                        }
                    })
                })

                const thrown = await sendUserOperationSync(smartAccountClient, {
                    calls: [{ to: zeroAddress, data: "0x", value: 0n }],
                    // The send is mocked, so skip estimation.
                    callGasLimit: 100_000n,
                    verificationGasLimit: 1_000_000n,
                    preVerificationGas: 100_000n,
                    maxFeePerGas: 0n,
                    maxPriorityFeePerGas: 0n,
                    timeout: 500
                }).catch((e) => e)

                expect(thrown).toBeInstanceOf(SendUserOperationSyncError)
                expect(thrown.kind).toBe(kind)
                expect(thrown.canResend).toBe(canResend)
                if (message) expect(thrown.shortMessage).toBe(message)
            }
        )
    }
)
