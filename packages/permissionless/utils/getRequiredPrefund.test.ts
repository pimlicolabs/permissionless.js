import type { UserOperation } from "viem/account-abstraction"
import { describe, expect, test } from "vitest"
import { getRequiredPrefund } from "./getRequiredPrefund"

describe("getRequiredPrefund", () => {
    describe("v0.6 UserOperation", () => {
        test("should calculate the required prefund without paymasterAndData", () => {
            const userOperation = {
                callGasLimit: BigInt(1000),
                verificationGasLimit: BigInt(2000),
                preVerificationGas: BigInt(500),
                maxFeePerGas: BigInt(10),
                paymasterAndData: "0x"
            }
            const result = getRequiredPrefund({
                userOperation: userOperation as UserOperation<"0.6">,
                entryPointVersion: "0.6"
            })
            const expectedGas =
                BigInt(1000) + BigInt(2000) * BigInt(1) + BigInt(500)
            const expectedResult = expectedGas * BigInt(10)
            expect(result).toBe(expectedResult)
        })

        test("should calculate the required prefund with paymasterAndData", () => {
            const userOperation = {
                callGasLimit: BigInt(1000),
                verificationGasLimit: BigInt(2000),
                preVerificationGas: BigInt(500),
                maxFeePerGas: BigInt(10),
                paymasterAndData: "0x1234"
            }
            const result = getRequiredPrefund({
                userOperation: userOperation as UserOperation<"0.6">,
                entryPointVersion: "0.6"
            })
            const multiplier = BigInt(3)
            const expectedGas =
                BigInt(1000) + BigInt(2000) * multiplier + BigInt(500)
            const expectedResult = expectedGas * BigInt(10)
            expect(result).toBe(expectedResult)
        })
    })
    describe("v0.7 UserOperation", () => {
        test("should calculate the required prefund without paymater gasLimits", () => {
            const userOperation = {
                callGasLimit: BigInt(1000),
                verificationGasLimit: BigInt(2000),
                preVerificationGas: BigInt(500),
                paymasterVerificationGasLimit: undefined,
                paymasterPostOpGasLimit: undefined,
                paymaster: undefined,
                paymasterData: undefined,
                maxFeePerGas: BigInt(10)
            }
            const result = getRequiredPrefund({
                userOperation: userOperation as UserOperation<"0.7">,
                entryPointVersion: "0.7"
            })
            const expectedGas =
                BigInt(1000) + BigInt(2000) * BigInt(1) + BigInt(500)
            const expectedResult = expectedGas * BigInt(10)
            expect(result).toBe(expectedResult)
        })

        test("should calculate the required prefund with paymaster gasLimits", () => {
            const userOperation = {
                callGasLimit: BigInt(1000),
                verificationGasLimit: BigInt(2000),
                preVerificationGas: BigInt(500),
                paymasterVerificationGasLimit: BigInt(20),
                paymasterPostOpGasLimit: BigInt(30),
                paymaster: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                maxFeePerGas: BigInt(10)
            }
            const result = getRequiredPrefund({
                userOperation: userOperation as UserOperation<"0.7">,
                entryPointVersion: "0.7"
            })
            const expectedGas =
                BigInt(1000) +
                BigInt(2000) +
                BigInt(500) +
                BigInt(20) +
                BigInt(30)
            const expectedResult = expectedGas * BigInt(10)
            expect(result).toBe(expectedResult)
        })
    })
})
