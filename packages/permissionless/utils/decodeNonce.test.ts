import { describe, expect, test } from "vitest"
import { decodeNonce, encodeNonce } from "./index"

describe("decodeNonce", () => {
    test("should encode key and sequence correctly", async () => {
        const key = 123456789012345678901234n
        const sequence = 9876543210n

        const result = encodeNonce({ key, sequence })

        const decodedNonce = decodeNonce(result)

        expect(decodedNonce.key).toBe(key)
        expect(decodedNonce.sequence).toBe(sequence)
    })

    test("should handle zero values correctly", () => {
        const key = BigInt(0)
        const sequence = BigInt(0)

        const result = encodeNonce({ key, sequence })

        const decodedNonce = decodeNonce(result)

        expect(decodedNonce.key).toBe(key)
        expect(decodedNonce.sequence).toBe(sequence)
    })

    test("should handle large values correctly", () => {
        const key = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFF")
        const sequence = BigInt("0xFFFFFFFF")

        const result = encodeNonce({ key, sequence })

        const decodedNonce = decodeNonce(result)

        expect(decodedNonce.key).toBe(key)
        expect(decodedNonce.sequence).toBe(sequence)
    })
})
