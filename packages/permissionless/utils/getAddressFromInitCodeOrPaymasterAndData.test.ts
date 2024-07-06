import { describe, expect, test } from "vitest"
import { getAddressFromInitCodeOrPaymasterAndData } from "./getAddressFromInitCodeOrPaymasterAndData"

describe("getAddressFromInitCodeOrPaymasterAndData", () => {
    test("should return undefined for undefined data", () => {
        expect(
            // @ts-expect-error
            getAddressFromInitCodeOrPaymasterAndData(undefined)
        ).toBeUndefined()
    })

    test("should return undefined for empty string data", () => {
        // @ts-expect-error
        expect(getAddressFromInitCodeOrPaymasterAndData("")).toBeUndefined()
    })

    test("should return undefined for data shorter than 42 characters", () => {
        const shortData = "0x123456789"
        expect(
            getAddressFromInitCodeOrPaymasterAndData(shortData)
        ).toBeUndefined()
    })

    test("should return the correct address for data exactly 42 characters", () => {
        const expectedAddress = "0x1234567890123456789012345678901234567890"
        const exactData = `${expectedAddress}_mocked_address_for`
        expect(getAddressFromInitCodeOrPaymasterAndData(exactData)).toBe(
            expectedAddress
        )
    })
})
