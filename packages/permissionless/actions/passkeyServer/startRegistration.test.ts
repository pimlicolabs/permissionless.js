import { describe, expect, test } from "vitest"
import { startRegistration } from "./startRegistration"

const validResponse = {
    attestation: "none",
    authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "preferred"
    },
    challenge: "dGVzdA==", // "test" base64
    extensions: undefined,
    rp: {
        id: "example.com",
        name: "Example"
    },
    user: {
        id: "dXNlcg==", // "user" base64
        name: "testuser",
        displayName: "Test User"
    },
    timeout: 60000
}

describe("startRegistration", () => {
    test("returns valid credential options", async () => {
        const mockClient = {
            request: async ({ method }: { method: string }) => {
                if (method === "pks_startRegistration") {
                    return validResponse
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await startRegistration(mockClient)

        expect(result.attestation).toBe("none")
        expect(result.rp.id).toBe("example.com")
        expect(result.rp.name).toBe("Example")
        expect(result.user.name).toBe("testuser")
        expect(result.user.displayName).toBe("Test User")
        expect(result.challenge).toBeDefined()
    })

    test("passes context to server", async () => {
        let receivedParams: any

        const mockClient = {
            request: async ({
                method,
                params
            }: { method: string; params: any }) => {
                receivedParams = params
                return validResponse
            }
        } as any

        await startRegistration(mockClient, {
            context: { appId: "test" }
        })

        expect(receivedParams).toEqual([{ appId: "test" }])
    })

    test("throws on invalid attestation", async () => {
        const mockClient = {
            request: async () => ({
                ...validResponse,
                attestation: "invalid"
            })
        } as any

        await expect(startRegistration(mockClient)).rejects.toThrow(
            "Invalid response format"
        )
    })

    test("throws on invalid authenticatorSelection", async () => {
        const mockClient = {
            request: async () => ({
                ...validResponse,
                authenticatorSelection: null
            })
        } as any

        await expect(startRegistration(mockClient)).rejects.toThrow(
            "Invalid response format"
        )
    })

    test("throws on invalid challenge", async () => {
        const mockClient = {
            request: async () => ({
                ...validResponse,
                challenge: null
            })
        } as any

        await expect(startRegistration(mockClient)).rejects.toThrow(
            "Invalid response format"
        )
    })

    test("throws on invalid rp", async () => {
        const mockClient = {
            request: async () => ({
                ...validResponse,
                rp: null
            })
        } as any

        await expect(startRegistration(mockClient)).rejects.toThrow(
            "Invalid response format"
        )
    })

    test("throws on invalid user", async () => {
        const mockClient = {
            request: async () => ({
                ...validResponse,
                user: null
            })
        } as any

        await expect(startRegistration(mockClient)).rejects.toThrow(
            "Invalid response format"
        )
    })

    test("accepts valid extensions", async () => {
        const mockClient = {
            request: async () => ({
                ...validResponse,
                extensions: { credProps: true }
            })
        } as any

        const result = await startRegistration(mockClient)
        expect(result.extensions).toBeDefined()
    })

    test("accepts all attestation types", async () => {
        for (const attestation of [
            "direct",
            "enterprise",
            "indirect",
            "none"
        ]) {
            const mockClient = {
                request: async () => ({
                    ...validResponse,
                    attestation
                })
            } as any

            const result = await startRegistration(mockClient)
            expect(result.attestation).toBe(attestation)
        }
    })
})
