import { describe, expect, test } from "vitest"
import {
    InvalidPasskeyCredentialError,
    InvalidPasskeyServerResponseError,
    PasskeyAttestationUnsupportedError
} from "../../errors/passkeyServer"
import { getCredentials } from "./getCredentials"
import { startRegistration } from "./startRegistration"
import { verifyAuthentication } from "./verifyAuthentication"
import { verifyRegistration } from "./verifyRegistration"

const server = (response: unknown) => ({ request: async () => response })
const bytes = new Uint8Array([1, 2, 3]).buffer
const raw = {
    id: "id",
    rawId: bytes,
    authenticatorAttachment: "platform",
    getClientExtensionResults: () => ({}),
    type: "public-key"
}

describe("passkey server actions", () => {
    test("getCredentials rejects malformed server responses", async () => {
        await expect(getCredentials(server("nope"))).rejects.toThrow(
            InvalidPasskeyServerResponseError
        )
        await expect(getCredentials(server([{ id: 1 }]))).rejects.toThrow(
            InvalidPasskeyServerResponseError
        )
        await expect(
            getCredentials(server([{ id: "a", publicKey: "01" }]))
        ).rejects.toThrow(InvalidPasskeyServerResponseError)
        await expect(
            getCredentials(server([{ id: "a", publicKey: "0x01" }]))
        ).resolves.toEqual([{ id: "a", publicKey: "0x01" }])
    })

    test("startRegistration rejects malformed server responses", async () => {
        await expect(startRegistration(server({}))).rejects.toThrow(
            InvalidPasskeyServerResponseError
        )
    })

    test("verifyAuthentication rejects incomplete credentials", async () => {
        const args = (response: Record<string, unknown>) =>
            ({ raw: { ...raw, response }, uuid: "uuid" }) as any
        await expect(
            verifyAuthentication(server({}), args({ clientDataJSON: bytes }))
        ).rejects.toThrow(InvalidPasskeyCredentialError)
        await expect(
            verifyAuthentication(
                server({}),
                args({ clientDataJSON: bytes, authenticatorData: bytes })
            )
        ).rejects.toThrow(InvalidPasskeyCredentialError)
        await expect(
            verifyAuthentication(
                server({ success: true, id: 1 }),
                args({
                    clientDataJSON: bytes,
                    authenticatorData: bytes,
                    signature: bytes
                })
            )
        ).rejects.toThrow(InvalidPasskeyServerResponseError)
    })

    test("verifyRegistration surfaces unsupported attestation methods", async () => {
        const credential = (response: Record<string, unknown>) =>
            ({ id: "id", raw: { ...raw, response } }) as any
        const response = {
            clientDataJSON: bytes,
            attestationObject: bytes
        }
        await expect(
            verifyRegistration(server({}), {
                credential: credential({
                    ...response,
                    getPublicKeyAlgorithm: () => {
                        throw new Error("nope")
                    }
                }),
                context: undefined
            })
        ).rejects.toThrow(PasskeyAttestationUnsupportedError)
        await expect(
            verifyRegistration(server({ success: true }), {
                credential: credential(response),
                context: undefined
            })
        ).rejects.toThrow(InvalidPasskeyServerResponseError)
    })
})
