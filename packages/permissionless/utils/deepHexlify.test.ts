import { toHex } from "viem"
import { describe, expect, test } from "vitest"
import { deepHexlify } from "../utils"

describe("deepHexlify", () => {
    test("should return undefined for function input", async () => {
        const func = () => {}
        expect(deepHexlify(func)).toBeUndefined()
    })

    test("should return null for null input", () => {
        expect(deepHexlify(null)).toBeNull()
    })

    test("should return the same string for string input", () => {
        const str = "test"
        expect(deepHexlify(str)).toBe(str)
    })

    test("should return the same boolean for boolean input", () => {
        const bool = true
        expect(deepHexlify(bool)).toBe(bool)
    })

    test("should return hex string for bigint input", () => {
        const bigint = BigInt(12345)
        expect(deepHexlify(bigint)).toBe(toHex(bigint))
    })

    test("should return hex string for number input", () => {
        const number = 12345
        expect(deepHexlify(number)).toBe(toHex(number).replace(/^0x0/, "0x"))
    })

    test("should return array with hex values for array input", () => {
        const array = [12345, BigInt(67890)]
        expect(deepHexlify(array)).toEqual([
            toHex(12345).replace(/^0x0/, "0x"),
            toHex(BigInt(67890))
        ])
    })

    test("should return object with hex values for object input", () => {
        const obj = {
            a: 12345,
            b: BigInt(67890),
            c: "string",
            d: true
        }
        expect(deepHexlify(obj)).toEqual({
            a: toHex(12345).replace(/^0x0/, "0x"),
            b: toHex(BigInt(67890)),
            c: "string",
            d: true
        })
    })
})
