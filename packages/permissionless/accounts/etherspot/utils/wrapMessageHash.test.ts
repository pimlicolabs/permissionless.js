import { keccak256, stringToHex } from "viem"
import { describe, expect, test } from "vitest"
import { wrapMessageHash } from "./wrapMessageHash"

describe("etherspot wrapMessageHash", () => {
    const accountAddress = "0x1234567890123456789012345678901234567890" as const
    const chainId = 1
    const messageHash = keccak256(stringToHex("hello"))

    test("returns a 66-char hex string", () => {
        const result = wrapMessageHash(messageHash, {
            accountAddress,
            chainId
        })

        expect(result).toBeDefined()
        expect(result.startsWith("0x")).toBe(true)
        expect(result.length).toBe(66)
    })

    test("is deterministic", () => {
        const result1 = wrapMessageHash(messageHash, {
            accountAddress,
            chainId
        })
        const result2 = wrapMessageHash(messageHash, {
            accountAddress,
            chainId
        })

        expect(result1).toBe(result2)
    })

    test("different chainId produces different result", () => {
        const result1 = wrapMessageHash(messageHash, {
            accountAddress,
            chainId: 1
        })
        const result2 = wrapMessageHash(messageHash, {
            accountAddress,
            chainId: 137
        })

        expect(result1).not.toBe(result2)
    })

    test("different accountAddress produces different result", () => {
        const result1 = wrapMessageHash(messageHash, {
            accountAddress: "0x1234567890123456789012345678901234567890",
            chainId
        })
        const result2 = wrapMessageHash(messageHash, {
            accountAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            chainId
        })

        expect(result1).not.toBe(result2)
    })

    test("different message produces different result", () => {
        const msg1 = keccak256(stringToHex("hello"))
        const msg2 = keccak256(stringToHex("world"))

        const result1 = wrapMessageHash(msg1, {
            accountAddress,
            chainId
        })
        const result2 = wrapMessageHash(msg2, {
            accountAddress,
            chainId
        })

        expect(result1).not.toBe(result2)
    })
})
