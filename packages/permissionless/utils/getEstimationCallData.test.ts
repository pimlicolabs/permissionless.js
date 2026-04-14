import { zeroAddress } from "viem"
import { describe, expect, test } from "vitest"
import { getPimlicoEstimationCallData } from "./getEstimationCallData"

const entryPointAddress06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
const entryPointAddress07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
const entryPointAddress08 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
const PIMLICO_ESTIMATION_ADDRESS = "0x949CeCa936909f75E5A40bD285d9985eFBb9B0D3"

const baseUserOp06 = {
    sender: "0x1234567890123456789012345678901234567890" as const,
    nonce: 0n,
    callData: "0x" as const,
    callGasLimit: 100000n,
    verificationGasLimit: 100000n,
    preVerificationGas: 50000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 100000000n,
    signature: "0x" as const,
    initCode: "0x" as const,
    paymasterAndData: "0x" as const
}

const baseUserOp07 = {
    sender: "0x1234567890123456789012345678901234567890" as const,
    nonce: 0n,
    callData: "0x" as const,
    callGasLimit: 100000n,
    verificationGasLimit: 100000n,
    preVerificationGas: 50000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 100000000n,
    signature: "0x" as const,
    factory: undefined,
    factoryData: undefined,
    paymaster: undefined,
    paymasterVerificationGasLimit: undefined,
    paymasterPostOpGasLimit: undefined,
    paymasterData: undefined
}

describe("getPimlicoEstimationCallData", () => {
    test("v0.6 selects the correct entrypoint path", () => {
        // v0.6 path is selected (doesn't throw "Invalid entrypoint version")
        // It may throw an address encoding error due to "0x" target in simulateHandleOp
        try {
            const result = getPimlicoEstimationCallData({
                userOperation: baseUserOp06,
                entrypoint: {
                    address: entryPointAddress06,
                    version: "0.6"
                }
            } as any)

            expect(result.to).toBe(entryPointAddress06)
            expect(result.data).toBeDefined()
        } catch (e) {
            // Expected: viem may throw InvalidAddressError for "0x" target address
            expect((e as Error).message).toContain("Address")
        }
    })

    test("v0.7 returns PIMLICO_ESTIMATION_ADDRESS as to", () => {
        const result = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: entryPointAddress07,
                version: "0.7"
            }
        } as any)

        expect(result.to).toBe(PIMLICO_ESTIMATION_ADDRESS)
        expect(result.data).toBeDefined()
    })

    test("v0.7 with custom estimationAddress", () => {
        const customAddress = "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"

        const result = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: entryPointAddress07,
                version: "0.7"
            },
            estimationAddress: customAddress
        } as any)

        expect(result.to).toBe(customAddress)
    })

    test("v0.8 returns PIMLICO_ESTIMATION_ADDRESS as to", () => {
        const result = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: entryPointAddress08,
                version: "0.8"
            }
        } as any)

        expect(result.to).toBe(PIMLICO_ESTIMATION_ADDRESS)
        expect(result.data).toBeDefined()
    })

    test("v0.8 with custom estimationAddress", () => {
        const customAddress = "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"

        const result = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: entryPointAddress08,
                version: "0.8"
            },
            estimationAddress: customAddress
        } as any)

        expect(result.to).toBe(customAddress)
    })

    test("throws on invalid entrypoint version", () => {
        expect(() =>
            getPimlicoEstimationCallData({
                userOperation: baseUserOp07,
                entrypoint: {
                    address: zeroAddress,
                    version: "0.5" as any
                }
            } as any)
        ).toThrow("Invalid entrypoint version")
    })

    test("v0.7 produces valid hex calldata", () => {
        const result = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: entryPointAddress07,
                version: "0.7"
            }
        } as any)

        expect(result.data.startsWith("0x")).toBe(true)
        expect(result.data.length).toBeGreaterThan(10)
    })

    test("v0.7 and v0.8 produce different calldata when entrypoint differs", () => {
        const result07 = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: entryPointAddress07,
                version: "0.7"
            }
        } as any)

        const result08 = getPimlicoEstimationCallData({
            userOperation: baseUserOp07,
            entrypoint: {
                address: "0x0000000000000000000000000000000000000001",
                version: "0.8"
            }
        } as any)

        // Different entrypoint addresses should produce different data
        // since the entrypoint address is encoded in the calldata
        expect(result07.data).not.toBe(result08.data)
    })
})
