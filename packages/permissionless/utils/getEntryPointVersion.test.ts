import { describe, expect, test } from "vitest"
import {
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07,
    getEntryPointVersion,
    isUserOperationVersion06,
    isUserOperationVersion07
} from "./getEntryPointVersion"

describe("getEntryPointVersion", () => {
    describe("getEntryPointVersion", () => {
        test('should return "v0.6" for ENTRYPOINT_ADDRESS_V06', () => {
            expect(getEntryPointVersion(ENTRYPOINT_ADDRESS_V06)).toBe("v0.6")
        })

        test('should return "v0.7" for ENTRYPOINT_ADDRESS_V07', () => {
            expect(getEntryPointVersion(ENTRYPOINT_ADDRESS_V07)).toBe("v0.7")
        })
    })

    describe("isUserOperationVersion06", () => {
        test('should return true for ENTRYPOINT_ADDRESS_V06 and UserOperation<"v0.6">', () => {
            const userOperation = {} as any // mock UserOperation<"v0.6">
            expect(
                isUserOperationVersion06(ENTRYPOINT_ADDRESS_V06, userOperation)
            ).toBe(true)
        })

        test('should return false for ENTRYPOINT_ADDRESS_V07 and UserOperation<"v0.6">', () => {
            const userOperation = {} as any // mock UserOperation<"v0.6">
            expect(
                isUserOperationVersion06(ENTRYPOINT_ADDRESS_V07, userOperation)
            ).toBe(false)
        })
    })

    describe("isUserOperationVersion07", () => {
        test('should return false for ENTRYPOINT_ADDRESS_V06 and UserOperation<"v0.6">', () => {
            const userOperation = {} as any // mock UserOperation<"v0.6">
            expect(
                isUserOperationVersion07(ENTRYPOINT_ADDRESS_V06, userOperation)
            ).toBe(false)
        })

        test('should return true for ENTRYPOINT_ADDRESS_V07 and UserOperation<"v0.7">', () => {
            const userOperation = {} as any // mock UserOperation<"v0.7">
            expect(
                isUserOperationVersion07(ENTRYPOINT_ADDRESS_V07, userOperation)
            ).toBe(true)
        })
    })
})
