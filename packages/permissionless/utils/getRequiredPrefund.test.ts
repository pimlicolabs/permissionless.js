import { describe, expect, test } from "vitest"
import { getRequiredPrefund } from "./getRequiredPrefund"
import {
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07
} from "./getEntryPointVersion"
import type { UserOperation } from "../types/userOperation"

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
                userOperation: userOperation as UserOperation<"v0.6">,
                entryPoint: ENTRYPOINT_ADDRESS_V06
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
                userOperation: userOperation as UserOperation<"v0.6">,
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })
            const multiplier = BigInt(3)
            const expectedGas =
                BigInt(1000) + BigInt(2000) * multiplier + BigInt(500)
            const expectedResult = expectedGas * BigInt(10)
            expect(result).toBe(expectedResult)
        })

        test("should calculate the required prefund with paymaster", () => {
            const userOperation = {
                callGasLimit: BigInt(1000),
                verificationGasLimit: BigInt(2000),
                preVerificationGas: BigInt(500),
                maxFeePerGas: BigInt(10),
                paymaster: "0xPaymasterAddress",
                paymasterPostOpGasLimit: BigInt(100),
                paymasterVerificationGasLimit: BigInt(200)
            }
            const result = getRequiredPrefund({
                userOperation: userOperation as UserOperation<"v0.7">,
                entryPoint: ENTRYPOINT_ADDRESS_V07
            })
            const multiplier = BigInt(3)
            const verificationGasLimit =
                BigInt(2000) + BigInt(100) + BigInt(200)
            const expectedGas =
                BigInt(1000) + verificationGasLimit * multiplier + BigInt(500)
            const expectedResult = expectedGas * BigInt(10)
            expect(result).toBe(expectedResult)
        })
    })
})
