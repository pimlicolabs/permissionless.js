import { describe, expect, test } from "vitest"
import { getCredentials } from "./getCredentials"

describe("getCredentials", () => {
    test("returns credentials from server", async () => {
        const mockCredentials = [
            { id: "cred-1", publicKey: "0xabc123" },
            { id: "cred-2", publicKey: "0xdef456" }
        ]

        const mockClient = {
            request: async ({ method }: { method: string }) => {
                if (method === "pks_getCredentials") {
                    return mockCredentials
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await getCredentials(mockClient)

        expect(result).toEqual(mockCredentials)
        expect(result).toHaveLength(2)
    })

    test("passes context to server", async () => {
        let receivedParams: any

        const mockClient = {
            request: async ({
                method,
                params
            }: { method: string; params: any[] }) => {
                if (method === "pks_getCredentials") {
                    receivedParams = params
                    return []
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        await getCredentials(mockClient, {
            context: { userId: "test-user" }
        })

        expect(receivedParams).toEqual([{ userId: "test-user" }])
    })

    test("throws on non-array response", async () => {
        const mockClient = {
            request: async () => ({ invalid: true })
        } as any

        await expect(getCredentials(mockClient)).rejects.toThrow(
            "Invalid response from server - expected array"
        )
    })

    test("throws on invalid passkey id", async () => {
        const mockClient = {
            request: async () => [{ id: 123, publicKey: "0xabc" }]
        } as any

        await expect(getCredentials(mockClient)).rejects.toThrow(
            "Invalid passkey id returned from server"
        )
    })

    test("throws on missing passkey id", async () => {
        const mockClient = {
            request: async () => [{ publicKey: "0xabc" }]
        } as any

        await expect(getCredentials(mockClient)).rejects.toThrow(
            "Invalid passkey id returned from server"
        )
    })

    test("throws on invalid public key", async () => {
        const mockClient = {
            request: async () => [{ id: "cred-1", publicKey: "abc" }]
        } as any

        await expect(getCredentials(mockClient)).rejects.toThrow(
            "Invalid public key returned from server"
        )
    })

    test("throws on missing public key", async () => {
        const mockClient = {
            request: async () => [{ id: "cred-1" }]
        } as any

        await expect(getCredentials(mockClient)).rejects.toThrow(
            "Invalid public key returned from server"
        )
    })

    test("returns empty array for no credentials", async () => {
        const mockClient = {
            request: async () => []
        } as any

        const result = await getCredentials(mockClient)
        expect(result).toEqual([])
    })

    test("calls correct RPC method", async () => {
        let calledMethod: string | undefined

        const mockClient = {
            request: async ({ method }: { method: string }) => {
                calledMethod = method
                return []
            }
        } as any

        await getCredentials(mockClient)
        expect(calledMethod).toBe("pks_getCredentials")
    })
})
