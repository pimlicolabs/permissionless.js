import { describe, expect, test } from "vitest"
import { verifyRegistration } from "./verifyRegistration"

const createMockCredential = () => ({
    id: "credential-id",
    publicKey: "0xabc123" as const,
    raw: {
        rawId: new Uint8Array([1, 2, 3]).buffer,
        authenticatorAttachment: "platform",
        response: {
            clientDataJSON: new Uint8Array([10, 20, 30]).buffer,
            attestationObject: new Uint8Array([40, 50, 60]).buffer,
            getPublicKeyAlgorithm: () => -7,
            getAuthenticatorData: () => new Uint8Array([70, 80, 90]).buffer,
            getTransports: () => ["internal" as const]
        },
        getClientExtensionResults: () => ({}),
        type: "public-key"
    }
})

describe("verifyRegistration", () => {
    test("returns verification result", async () => {
        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc123",
                userName: "testuser"
            })
        } as any

        const result = await verifyRegistration(mockClient, {
            credential: createMockCredential() as any,
            context: {}
        })

        expect(result.success).toBe(true)
        expect(result.id).toBe("cred-123")
        expect(result.publicKey).toBe("0xabc123")
        expect(result.userName).toBe("testuser")
    })

    test("handles credential without getPublicKeyAlgorithm", async () => {
        const cred = createMockCredential()
        // @ts-ignore
        cred.raw.response.getPublicKeyAlgorithm = undefined

        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc",
                userName: "test"
            })
        } as any

        const result = await verifyRegistration(mockClient, {
            credential: cred as any,
            context: {}
        })

        expect(result.success).toBe(true)
    })

    test("handles credential without getAuthenticatorData", async () => {
        const cred = createMockCredential()
        // @ts-ignore
        cred.raw.response.getAuthenticatorData = undefined

        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc",
                userName: "test"
            })
        } as any

        const result = await verifyRegistration(mockClient, {
            credential: cred as any,
            context: {}
        })

        expect(result.success).toBe(true)
    })

    test("handles credential without getTransports", async () => {
        const cred = createMockCredential()
        // @ts-ignore
        cred.raw.response.getTransports = undefined

        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc",
                userName: "test"
            })
        } as any

        const result = await verifyRegistration(mockClient, {
            credential: cred as any,
            context: {}
        })

        expect(result.success).toBe(true)
    })

    test("throws on invalid id from server", async () => {
        const mockClient = {
            request: async () => ({
                success: true,
                id: 123,
                publicKey: "0xabc",
                userName: "test"
            })
        } as any

        await expect(
            verifyRegistration(mockClient, {
                credential: createMockCredential() as any,
                context: {}
            })
        ).rejects.toThrow("Invalid passkey id")
    })

    test("throws on invalid publicKey from server", async () => {
        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "abc",
                userName: "test"
            })
        } as any

        await expect(
            verifyRegistration(mockClient, {
                credential: createMockCredential() as any,
                context: {}
            })
        ).rejects.toThrow("Invalid public key")
    })

    test("throws on invalid userName from server", async () => {
        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc",
                userName: 123
            })
        } as any

        await expect(
            verifyRegistration(mockClient, {
                credential: createMockCredential() as any,
                context: {}
            })
        ).rejects.toThrow("Invalid user name")
    })

    test("calls pks_verifyRegistration method", async () => {
        let calledMethod: string | undefined

        const mockClient = {
            request: async ({ method }: { method: string }) => {
                calledMethod = method
                return {
                    success: true,
                    id: "cred-123",
                    publicKey: "0xabc",
                    userName: "test"
                }
            }
        } as any

        await verifyRegistration(mockClient, {
            credential: createMockCredential() as any,
            context: {}
        })

        expect(calledMethod).toBe("pks_verifyRegistration")
    })
})
