import { describe, expect, test } from "vitest"
import { startAuthentication } from "./startAuthentication"

describe("startAuthentication", () => {
    test("returns authentication challenge data", async () => {
        const mockClient = {
            request: async ({ method }: { method: string }) => {
                if (method === "pks_startAuthentication") {
                    return {
                        challenge: "dGVzdA==", // "test" base64
                        rpId: "example.com",
                        userVerification: "preferred",
                        uuid: "test-uuid-123"
                    }
                }
                throw new Error(`Unknown method: ${method}`)
            }
        } as any

        const result = await startAuthentication(mockClient)

        expect(result.challenge).toBeDefined()
        expect(result.challenge.startsWith("0x")).toBe(true)
        expect(result.rpId).toBe("example.com")
        expect(result.userVerification).toBe("preferred")
        expect(result.uuid).toBe("test-uuid-123")
    })

    test("calls pks_startAuthentication method", async () => {
        let calledMethod: string | undefined

        const mockClient = {
            request: async ({ method }: { method: string }) => {
                calledMethod = method
                return {
                    challenge: "dGVzdA==",
                    rpId: "example.com",
                    uuid: "test-uuid"
                }
            }
        } as any

        await startAuthentication(mockClient)
        expect(calledMethod).toBe("pks_startAuthentication")
    })

    test("handles missing userVerification", async () => {
        const mockClient = {
            request: async () => ({
                challenge: "dGVzdA==",
                rpId: "example.com",
                uuid: "test-uuid"
            })
        } as any

        const result = await startAuthentication(mockClient)

        expect(result.userVerification).toBeUndefined()
    })
})
