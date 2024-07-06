import { describe, expect, test } from "vitest"
import type { UserOperation } from "../types/userOperation"
import {
    getAccountGasLimits,
    getGasLimits,
    getInitCode,
    getPackedUserOperation,
    getPaymasterAndData,
    unPackInitCode,
    unpackAccountGasLimits,
    unpackGasLimits,
    unpackPaymasterAndData
} from "./getPackedUserOperation"

describe("getPackedUserOperation", () => {
    describe("getInitCode", () => {
        test("should return concatenated factory and factoryData", () => {
            const userOperation = {
                factory: "0x60e04be163dBb94688952449bbD9755D1Cd63231",
                factoryData: "0xfedcba0987654321"
            }
            expect(getInitCode(userOperation as UserOperation<"v0.7">)).toBe(
                "0x60e04be163dBb94688952449bbD9755D1Cd63231fedcba0987654321"
            )
        })

        test("should return factory with default factoryData when factoryData is missing", () => {
            const userOperation = {
                factory: "0x1234567890abcdef"
            }
            expect(getInitCode(userOperation as UserOperation<"v0.7">)).toBe(
                "0x1234567890abcdef"
            )
        })

        test('should return "0x" when factory is missing', () => {
            const userOperation = {}
            expect(getInitCode(userOperation as UserOperation<"v0.7">)).toBe(
                "0x"
            )
        })
    })

    describe("unPackInitCode", () => {
        test('should return nulls for factory and factoryData when initCode is "0x"', () => {
            expect(unPackInitCode("0x")).toEqual({
                factory: null,
                factoryData: null
            })
        })

        test("should return sliced factory and factoryData from initCode", () => {
            const initCode =
                "0x60e04be163dBb94688952449bbD9755D1Cd63231fedcba0987654321"
            expect(unPackInitCode(initCode)).toEqual({
                factory: "0x60e04be163dBb94688952449bbD9755D1Cd63231",
                factoryData: "0xfedcba0987654321"
            })
        })
    })

    describe("getAccountGasLimits", () => {
        test("should return concatenated padded verificationGasLimit and callGasLimit", () => {
            const userOperation = {
                verificationGasLimit: BigInt(1000),
                callGasLimit: BigInt(2000)
            }
            expect(
                getAccountGasLimits(userOperation as UserOperation<"v0.7">)
            ).toBe(
                "0x000000000000000000000000000003e8000000000000000000000000000007d0"
            )
        })
    })

    describe("unpackAccountGasLimits", () => {
        test("should return verificationGasLimit and callGasLimit from sliced accountGasLimits", () => {
            const accountGasLimits =
                "0x000000000000000000000000000003e8000000000000000000000000000007d0"
            expect(unpackAccountGasLimits(accountGasLimits)).toEqual({
                verificationGasLimit: BigInt(1000),
                callGasLimit: BigInt(2000)
            })
        })
    })

    describe("getGasLimits", () => {
        test("should return concatenated padded maxPriorityFeePerGas and maxFeePerGas", () => {
            const userOperation = {
                maxPriorityFeePerGas: BigInt(1000),
                maxFeePerGas: BigInt(2000)
            }
            expect(getGasLimits(userOperation as UserOperation<"v0.7">)).toBe(
                "0x000000000000000000000000000003e8000000000000000000000000000007d0"
            )
        })
    })

    describe("unpackGasLimits", () => {
        test("should return maxPriorityFeePerGas and maxFeePerGas from sliced gasLimits", () => {
            const gasLimits =
                "0x000000000000000000000000000003e8000000000000000000000000000007d0"
            expect(unpackGasLimits(gasLimits)).toEqual({
                maxPriorityFeePerGas: BigInt(1000),
                maxFeePerGas: BigInt(2000)
            })
        })
    })

    describe("getPaymasterAndData", () => {
        test("should return concatenated paymaster, verificationGasLimit, postOpGasLimit and paymasterData", () => {
            const userOperation = {
                paymaster: "0x60e04be163dBb94688952449bbD9755D1Cd63231",
                paymasterVerificationGasLimit: BigInt(1000),
                paymasterPostOpGasLimit: BigInt(2000),
                paymasterData: "0xabcdef"
            }
            expect(
                getPaymasterAndData(userOperation as UserOperation<"v0.7">)
            ).toBe(
                "0x60e04be163dBb94688952449bbD9755D1Cd63231000000000000000000000000000003e8000000000000000000000000000007d0abcdef"
            )
        })

        test("should return concatenated paymaster with default values when some fields are missing", () => {
            const userOperation = {
                paymaster: "0x1234567890abcdef"
            }
            expect(
                getPaymasterAndData(userOperation as UserOperation<"v0.7">)
            ).toBe(
                "0x1234567890abcdef0000000000000000000000000000000000000000000000000000000000000000"
            )
        })

        test('should return "0x" when paymaster is missing', () => {
            const userOperation = {}
            expect(
                getPaymasterAndData(userOperation as UserOperation<"v0.7">)
            ).toBe("0x")
        })
    })

    describe("unpackPaymasterAndData", () => {
        test('should return nulls for all fields when paymasterAndData is "0x"', () => {
            expect(unpackPaymasterAndData("0x")).toEqual({
                paymaster: null,
                paymasterVerificationGasLimit: null,
                paymasterPostOpGasLimit: null,
                paymasterData: null
            })
        })

        test("should return sliced fields from paymasterAndData", () => {
            const paymasterAndData =
                "0x60e04be163dBb94688952449bbD9755D1Cd63231000000000000000000000000000003e8000000000000000000000000000007d0abcdef"
            expect(unpackPaymasterAndData(paymasterAndData)).toEqual({
                paymaster: "0x60e04be163dBb94688952449bbD9755D1Cd63231",
                paymasterVerificationGasLimit: BigInt(1000),
                paymasterPostOpGasLimit: BigInt(2000),
                paymasterData: "0xabcdef"
            })
        })
    })

    describe("getPackedUserOperation", () => {
        test("should return packed user operation", () => {
            const userOperation = {
                sender: "0xsender",
                nonce: BigInt(1),
                factory: "0xfactory",
                factoryData: "0xfactoryData",
                verificationGasLimit: BigInt(1000),
                callGasLimit: BigInt(2000),
                callData: "0xcallData",
                preVerificationGas: BigInt(500),
                maxPriorityFeePerGas: BigInt(3000),
                maxFeePerGas: BigInt(4000),
                paymaster: "0xpaymaster",
                paymasterVerificationGasLimit: BigInt(5000),
                paymasterPostOpGasLimit: BigInt(6000),
                paymasterData: "0xpaymasterData",
                signature: "0xsignature"
            }
            const packedUserOperation = getPackedUserOperation(
                userOperation as UserOperation<"v0.7">
            )
            expect(packedUserOperation).toEqual({
                sender: "0xsender",
                callData: "0xcallData",
                nonce: BigInt(1),
                initCode: "0xfactoryfactoryData",
                accountGasLimits:
                    "0x000000000000000000000000000003e8000000000000000000000000000007d0",
                preVerificationGas: BigInt(500),
                gasFees:
                    "0x00000000000000000000000000000bb800000000000000000000000000000fa0",
                paymasterAndData:
                    "0xpaymaster0000000000000000000000000000138800000000000000000000000000001770paymasterData",
                signature: "0xsignature"
            })
        })
    })
})
