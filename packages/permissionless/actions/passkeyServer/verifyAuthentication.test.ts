import { describe, expect, test } from "vitest"
import { verifyAuthentication } from "./verifyAuthentication"

const createMockRaw = () => ({
    id: "credential-id",
    rawId: new Uint8Array([1, 2, 3]).buffer,
    authenticatorAttachment: "platform",
    response: {
        authenticatorData: new Uint8Array([10, 20, 30]).buffer,
        signature: new Uint8Array([40, 50, 60]).buffer,
        userHandle: new Uint8Array([70, 80, 90]).buffer,
        clientDataJSON: new Uint8Array([100, 110, 120]).buffer
    },
    getClientExtensionResults: () => ({}),
    type: "public-key"
})

describe("verifyAuthentication", () => {
    test("returns verification result", async () => {
        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc123",
                userName: "testuser"
            })
        } as any

        const result = await verifyAuthentication(mockClient, {
            raw: createMockRaw(),
            uuid: "test-uuid"
        })

        expect(result.success).toBe(true)
        expect(result.id).toBe("cred-123")
        expect(result.publicKey).toBe("0xabc123")
        expect(result.userName).toBe("testuser")
    })

    test("throws when authenticatorData is missing", async () => {
        const raw = {
            ...createMockRaw(),
            response: {
                signature: new Uint8Array([40, 50, 60]).buffer,
                userHandle: new Uint8Array([70, 80, 90]).buffer,
                clientDataJSON: new Uint8Array([100, 110, 120]).buffer
            }
        }

        const mockClient = {
            request: async () => ({})
        } as any

        await expect(
            verifyAuthentication(mockClient, {
                raw,
                uuid: "test-uuid"
            })
        ).rejects.toThrow("authenticatorData not found")
    })

    test("throws when signature is missing", async () => {
        const raw = {
            ...createMockRaw(),
            response: {
                authenticatorData: new Uint8Array([10, 20, 30]).buffer,
                userHandle: new Uint8Array([70, 80, 90]).buffer,
                clientDataJSON: new Uint8Array([100, 110, 120]).buffer
            }
        }

        const mockClient = {
            request: async () => ({})
        } as any

        await expect(
            verifyAuthentication(mockClient, {
                raw,
                uuid: "test-uuid"
            })
        ).rejects.toThrow("signature not found")
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
            verifyAuthentication(mockClient, {
                raw: createMockRaw(),
                uuid: "test-uuid"
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
            verifyAuthentication(mockClient, {
                raw: createMockRaw(),
                uuid: "test-uuid"
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
            verifyAuthentication(mockClient, {
                raw: createMockRaw(),
                uuid: "test-uuid"
            })
        ).rejects.toThrow("Invalid user name")
    })

    test("handles optional userHandle", async () => {
        const raw = {
            ...createMockRaw(),
            response: {
                authenticatorData: new Uint8Array([10, 20, 30]).buffer,
                signature: new Uint8Array([40, 50, 60]).buffer,
                clientDataJSON: new Uint8Array([100, 110, 120]).buffer
            }
        }

        const mockClient = {
            request: async () => ({
                success: true,
                id: "cred-123",
                publicKey: "0xabc",
                userName: "test"
            })
        } as any

        const result = await verifyAuthentication(mockClient, {
            raw,
            uuid: "test-uuid"
        })

        expect(result.success).toBe(true)
    })
})
