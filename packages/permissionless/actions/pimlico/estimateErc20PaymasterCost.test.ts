import { describe, expect, test } from "vitest"
import { estimateErc20PaymasterCost } from "./estimateErc20PaymasterCost"

describe("estimateErc20PaymasterCost", () => {
    test("throws ChainNotFoundError when no chain", async () => {
        const mockClient = {
            chain: undefined,
            request: async () => ({})
        } as any

        await expect(
            estimateErc20PaymasterCost(mockClient, {
                entryPoint: {
                    address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
                    version: "0.7"
                },
                userOperation: {
                    sender: "0x1234567890123456789012345678901234567890",
                    nonce: 0n,
                    callData: "0x",
                    callGasLimit: 100000n,
                    verificationGasLimit: 100000n,
                    preVerificationGas: 50000n,
                    maxFeePerGas: 1000000000n,
                    maxPriorityFeePerGas: 100000000n,
                    signature: "0x"
                },
                token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
            } as any)
        ).rejects.toThrow()
    })

    test("calculates cost from token quotes", async () => {
        const mockClient = {
            chain: { id: 1 },
            request: async ({ method }: { method: string }) => {
                if (method === "pimlico_getTokenQuotes") {
                    return {
                        quotes: [
                            {
                                paymaster:
                                    "0x1234567890123456789012345678901234567890",
                                token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                                postOpGas: "0x0",
                                exchangeRate: "0xDE0B6B3A7640000",
                                exchangeRateNativeToUsd: "0xDE0B6B3A7640000"
                            }
                        ]
                    }
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await estimateErc20PaymasterCost(mockClient, {
            entryPoint: {
                address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
                version: "0.7"
            },
            userOperation: {
                sender: "0x1234567890123456789012345678901234567890",
                nonce: 0n,
                callData: "0x",
                callGasLimit: 100000n,
                verificationGasLimit: 100000n,
                preVerificationGas: 50000n,
                maxFeePerGas: 1000000000n,
                maxPriorityFeePerGas: 100000000n,
                signature: "0x"
            },
            token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            chain: { id: 1 }
        } as any)

        expect(typeof result.costInToken).toBe("bigint")
        expect(typeof result.costInUsd).toBe("bigint")
        expect(result.costInToken).toBeGreaterThan(0n)
    })
})
