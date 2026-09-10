import { custom } from "viem"
import { describe, expect, test } from "vitest"
import {
    InvalidPasskeyCredentialError,
    InvalidPasskeyServerResponseError
} from "../../errors/passkeyServer"
import * as PasskeyServerClient from "./index"

const bytes = new Uint8Array([1, 2, 3]).buffer
const calls: string[] = []
const client = PasskeyServerClient.create({
    transport: custom({
        request: async ({ method }: { method: string }) => {
            calls.push(method)
            if (method === "pks_getCredentials")
                return [{ id: "id", publicKey: "0x01" }]
            if (method === "pks_startAuthentication")
                return {
                    challenge: "AQID",
                    rpId: "pimlico.io",
                    uuid: "uuid"
                }
            return {}
        }
    })
})

describe("PasskeyServerClient", () => {
    test("carries the passkey server defaults", () => {
        expect(client.key).toBe("public")
        expect(client.name).toBe("Passkey Server Client")
        expect(client.type).toBe("passkeyServerClient")
    })

    test("getCredentials and startAuthentication reach the server", async () => {
        expect(await client.getCredentials({})).toEqual([
            { id: "id", publicKey: "0x01" }
        ])
        expect(await client.startAuthentication()).toEqual({
            challenge: "0x010203",
            rpId: "pimlico.io",
            userVerification: undefined,
            uuid: "uuid"
        })
        expect(calls).toEqual(["pks_getCredentials", "pks_startAuthentication"])
    })

    test("the decorated actions surface their own validation errors", async () => {
        await expect(client.startRegistration({})).rejects.toThrow(
            InvalidPasskeyServerResponseError
        )
        await expect(
            client.verifyAuthentication({
                raw: {
                    id: "id",
                    rawId: bytes,
                    authenticatorAttachment: "platform",
                    response: { clientDataJSON: bytes },
                    getClientExtensionResults: () => ({}),
                    type: "public-key"
                },
                uuid: "uuid"
            })
        ).rejects.toThrow(InvalidPasskeyCredentialError)
        await expect(
            client.verifyRegistration({
                credential: {
                    id: "id",
                    raw: {
                        rawId: bytes,
                        response: {
                            clientDataJSON: bytes,
                            attestationObject: bytes
                        },
                        authenticatorAttachment: "platform",
                        getClientExtensionResults: () => ({}),
                        type: "public-key"
                    }
                } as never,
                context: {}
            })
        ).rejects.toThrow(InvalidPasskeyServerResponseError)
    })
})
