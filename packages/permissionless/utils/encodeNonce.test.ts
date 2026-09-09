import { Hex } from "viem/utils"
import { describe, expect, test } from "vitest"
import * as Nonce from "./nonce"

describe("Nonce.encode", () => {
    test("should encode key and sequence correctly", async () => {
        const key = 123456789012345678901234n
        const sequence = 9876543210n
        const expectedKey = BigInt(Hex.fromNumber(key, { size: 24 }))
        const expectedSequence = BigInt(Hex.fromNumber(sequence, { size: 8 }))

        const result = Nonce.encode({ key, sequence })

        expect(result).toBe((expectedKey << BigInt(64)) + expectedSequence)
    })

    test("should handle zero values correctly", () => {
        const key = BigInt(0)
        const sequence = BigInt(0)
        const expectedKey = BigInt(Hex.fromNumber(key, { size: 24 }))
        const expectedSequence = BigInt(Hex.fromNumber(sequence, { size: 8 }))

        const result = Nonce.encode({ key, sequence })

        expect(result).toBe((expectedKey << BigInt(64)) + expectedSequence)
    })

    test("should handle large values correctly", () => {
        const key = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFF")
        const sequence = BigInt("0xFFFFFFFF")
        const expectedKey = BigInt(Hex.fromNumber(key, { size: 24 }))
        const expectedSequence = BigInt(Hex.fromNumber(sequence, { size: 8 }))

        const result = Nonce.encode({ key, sequence })

        expect(result).toBe((expectedKey << BigInt(64)) + expectedSequence)
    })
})
