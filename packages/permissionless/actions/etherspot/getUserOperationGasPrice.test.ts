import { describe, expect, test } from "vitest"
import { getUserOperationGasPrice } from "./getUserOperationGasPrice"

describe("etherspot getUserOperationGasPrice", () => {
    test("returns gas prices as bigints", async () => {
        const mockClient = {
            request: async ({ method }: { method: string }) => {
                if (method === "skandha_getGasPrice") {
                    return {
                        maxFeePerGas: "0x3b9aca00",
                        maxPriorityFeePerGas: "0x5f5e100"
                    }
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await getUserOperationGasPrice(mockClient)

        expect(typeof result.maxFeePerGas).toBe("bigint")
        expect(typeof result.maxPriorityFeePerGas).toBe("bigint")
        expect(result.maxFeePerGas).toBe(1000000000n)
        expect(result.maxPriorityFeePerGas).toBe(100000000n)
    })

    test("handles different hex values correctly", async () => {
        const mockClient = {
            request: async ({ method }: { method: string }) => {
                if (method === "skandha_getGasPrice") {
                    return {
                        maxFeePerGas: "0x1",
                        maxPriorityFeePerGas: "0x0"
                    }
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await getUserOperationGasPrice(mockClient)

        expect(result.maxFeePerGas).toBe(1n)
        expect(result.maxPriorityFeePerGas).toBe(0n)
    })

    test("handles large gas price values", async () => {
        const mockClient = {
            request: async ({ method }: { method: string }) => {
                if (method === "skandha_getGasPrice") {
                    return {
                        maxFeePerGas: "0xDE0B6B3A7640000",
                        maxPriorityFeePerGas: "0x2386F26FC10000"
                    }
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await getUserOperationGasPrice(mockClient)

        expect(result.maxFeePerGas).toBe(1000000000000000000n)
        expect(result.maxPriorityFeePerGas).toBe(10000000000000000n)
    })

    test("calls skandha_getGasPrice method", async () => {
        let calledMethod: string | undefined

        const mockClient = {
            request: async ({ method }: { method: string }) => {
                calledMethod = method
                return {
                    maxFeePerGas: "0x1",
                    maxPriorityFeePerGas: "0x1"
                }
            }
        } as any

        await getUserOperationGasPrice(mockClient)

        expect(calledMethod).toBe("skandha_getGasPrice")
    })
})
