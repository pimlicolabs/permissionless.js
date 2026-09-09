import { describe, expect, test } from "vitest"
import * as Base64 from "./base64"

const bytes = new Uint8Array([0xfb, 0xff, 0x00, 0x41, 0x3e])

describe("base64", () => {
    test("fromBytes encodes standard base64 with padding by default", () => {
        expect(Base64.fromBytes(bytes)).toBe("+/8AQT4=")
    })

    test("fromBytes supports base64url and unpadded output", () => {
        expect(Base64.fromBytes(bytes, { url: true })).toBe("-_8AQT4=")
        expect(Base64.fromBytes(bytes, { url: true, pad: false })).toBe(
            "-_8AQT4"
        )
        expect(Base64.fromBytes(new Uint8Array([]), { pad: false })).toBe("")
    })

    test("toBytes decodes standard, url-safe, padded and unpadded input", () => {
        for (const encoded of ["+/8AQT4=", "-_8AQT4=", "-_8AQT4", "+/8AQT4"]) {
            expect(Base64.toBytes(encoded)).toStrictEqual(bytes)
        }
        expect(Base64.toBytes("")).toStrictEqual(new Uint8Array([]))
    })

    test("round-trips the WebAuthn challenge shape", () => {
        const challenge = new Uint8Array(32).map((_, i) => (i * 37) % 256)
        const encoded = Base64.fromBytes(challenge, { url: true, pad: false })
        expect(encoded).not.toMatch(/[+/=]/)
        expect(Base64.toBytes(encoded)).toStrictEqual(challenge)
    })
})
