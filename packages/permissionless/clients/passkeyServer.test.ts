import { http } from "viem"
import { describe, expect, test } from "vitest"
import { createPasskeyServerClient } from "./passkeyServer"

describe("createPasskeyServerClient", () => {
    test("creates client with passkey server actions", () => {
        const client = createPasskeyServerClient({
            transport: http("http://localhost:3000")
        })

        expect(client.startRegistration).toBeDefined()
        expect(typeof client.startRegistration).toBe("function")
        expect(client.verifyRegistration).toBeDefined()
        expect(typeof client.verifyRegistration).toBe("function")
        expect(client.startAuthentication).toBeDefined()
        expect(typeof client.startAuthentication).toBe("function")
        expect(client.verifyAuthentication).toBeDefined()
        expect(typeof client.verifyAuthentication).toBe("function")
        expect(client.getCredentials).toBeDefined()
        expect(typeof client.getCredentials).toBe("function")
    })

    test("uses default key and name", () => {
        const client = createPasskeyServerClient({
            transport: http("http://localhost:3000")
        })

        expect(client.name).toBe("Passkey Server Client")
    })

    test("accepts custom key and name", () => {
        const client = createPasskeyServerClient({
            transport: http("http://localhost:3000"),
            key: "custom-key",
            name: "Custom Passkey Client"
        })

        expect(client.name).toBe("Custom Passkey Client")
    })
})
