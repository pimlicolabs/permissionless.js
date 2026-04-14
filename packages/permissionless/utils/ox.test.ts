import { describe, expect, test } from "vitest"
import { getOxExports, getOxModule, hasOxModule } from "./ox"

describe("ox module utilities", () => {
    test("hasOxModule returns true when ox is installed", () => {
        expect(hasOxModule()).toBe(true)
    })

    test("getOxModule resolves with the ox module", async () => {
        const ox = await getOxModule()
        expect(ox).toBeDefined()
        expect(ox.Base64).toBeDefined()
    })

    test("getOxExports returns all required exports", async () => {
        const exports = await getOxExports()

        expect(exports.Base64).toBeDefined()
        expect(exports.Hex).toBeDefined()
        expect(exports.PublicKey).toBeDefined()
        expect(exports.Signature).toBeDefined()
        expect(exports.WebAuthnP256).toBeDefined()
    })

    test("Base64 encoding works", async () => {
        const { Base64 } = await getOxExports()

        const bytes = new Uint8Array([104, 101, 108, 108, 111])
        const encoded = Base64.fromBytes(bytes)
        expect(encoded).toBe("aGVsbG8=")
    })

    test("Base64 decoding works", async () => {
        const { Base64 } = await getOxExports()

        const decoded = Base64.toBytes("aGVsbG8=")
        expect(decoded).toEqual(new Uint8Array([104, 101, 108, 108, 111]))
    })
})
