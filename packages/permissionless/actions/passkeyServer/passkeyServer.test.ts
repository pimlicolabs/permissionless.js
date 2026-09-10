import type { Client } from "viem"
import { describe, expect, test } from "vitest"
import {
    InvalidPasskeyCredentialError,
    InvalidPasskeyServerResponseError,
    PasskeyAttestationUnsupportedError
} from "../../errors/passkeyServer"
import { getCredentials } from "./getCredentials"
import { startAuthentication } from "./startAuthentication"
import { startRegistration } from "./startRegistration"
import { verifyAuthentication } from "./verifyAuthentication"
import { verifyRegistration } from "./verifyRegistration"

const server = (response: unknown): Pick<Client.Client, "request"> => ({
    // canned pks_* result; the actions only call `request`
    request: (async () => response) as unknown as Client.Client["request"]
})
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

describe("passkey server credential options", () => {
    const options = {
        attestation: "none",
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: true,
            residentKey: "required",
            userVerification: "required"
        },
        challenge: "AQID",
        rp: { id: "pimlico.io", name: "Pimlico" },
        timeout: 60_000,
        user: { id: "BAUG", name: "alice", displayName: "Alice" }
    }

    test("startRegistration decodes the base64url challenge and user id", async () => {
        const credentialOptions = await startRegistration(server(options))
        expect(credentialOptions.challenge).toEqual(new Uint8Array([1, 2, 3]))
        expect(credentialOptions.user).toEqual({
            id: new Uint8Array([4, 5, 6]),
            name: "alice",
            displayName: "Alice"
        })
        expect(credentialOptions.extensions).toBeUndefined()
        expect(credentialOptions.rp).toEqual(options.rp)
        expect(credentialOptions.timeout).toBe(60_000)
    })

    test("startRegistration rejects every malformed field on its own", async () => {
        const rejects = async (override: Record<string, unknown>) =>
            expect(
                startRegistration(server({ ...options, ...override }))
            ).rejects.toThrow(InvalidPasskeyServerResponseError)

        await rejects({ attestation: "sometimes" })
        await rejects({ authenticatorSelection: { residentKey: "required" } })
        await rejects({
            authenticatorSelection: {
                ...options.authenticatorSelection,
                requireResidentKey: "yes"
            }
        })
        await rejects({ challenge: 1 })
        await rejects({ extensions: "none" })
        await rejects({ extensions: { appid: 1 } })
        await rejects({ extensions: { credProps: "yes" } })
        await rejects({ rp: { id: "pimlico.io" } })
        await rejects({ user: { id: "BAUG", name: "alice" } })
    })

    test("startRegistration passes through well-formed extensions", async () => {
        const extensions = { appid: "pimlico.io", credProps: true }
        const credentialOptions = await startRegistration(
            server({ ...options, extensions })
        )
        expect(credentialOptions.extensions).toEqual(extensions)
    })

    test("startAuthentication returns the challenge as hex", async () => {
        expect(
            await startAuthentication(
                server({
                    challenge: "AQID",
                    rpId: "pimlico.io",
                    userVerification: "required",
                    uuid: "uuid"
                })
            )
        ).toEqual({
            challenge: "0x010203",
            rpId: "pimlico.io",
            userVerification: "required",
            uuid: "uuid"
        })
    })
})

describe("passkey server verification", () => {
    const success = {
        success: true,
        id: "id",
        publicKey: "0x01",
        userName: "alice"
    }
    const capture = (response: unknown) => {
        const params: unknown[] = []
        const client: Pick<Client.Client, "request"> = {
            request: (async ({ params: p }: { params: unknown[] }) => {
                params.push(...p)
                return response
            }) as unknown as Client.Client["request"]
        }
        return { params, client }
    }

    test("verifyRegistration base64-encodes the attestation for the server", async () => {
        const { params, client } = capture(success)
        const credential = {
            id: "id",
            raw: {
                ...raw,
                rawId: new Uint8Array([251, 255]).buffer,
                response: {
                    clientDataJSON: bytes,
                    attestationObject: new Uint8Array([251, 255]).buffer,
                    getPublicKeyAlgorithm: () => -7,
                    getAuthenticatorData: () => bytes,
                    getTransports: () => ["internal"]
                }
            }
        } as never

        expect(
            await verifyRegistration(client, { credential, context: {} })
        ).toEqual(success)
        expect(params[0]).toEqual({
            id: "id",
            // unpadded base64url: "+/8=" becomes "-_8"
            rawId: "-_8",
            response: {
                clientDataJSON: "AQID",
                attestationObject: "-_8=",
                transports: ["internal"],
                publicKeyAlgorithm: -7,
                authenticatorData: "AQID"
            },
            authenticatorAttachment: "platform",
            clientExtensionResults: {},
            type: "public-key"
        })
    })

    test("verifyRegistration surfaces a broken getPublicKeyAlgorithm", async () => {
        const { client } = capture(success)
        await expect(
            verifyRegistration(client, {
                credential: {
                    id: "id",
                    raw: {
                        ...raw,
                        response: {
                            clientDataJSON: bytes,
                            attestationObject: bytes,
                            getPublicKeyAlgorithm: () => {
                                throw new Error("no attestation")
                            }
                        }
                    }
                } as never,
                context: {}
            })
        ).rejects.toThrow(PasskeyAttestationUnsupportedError)
    })

    test("verifyAuthentication forwards the uuid and an optional userHandle", async () => {
        const { params, client } = capture(success)
        expect(
            await verifyAuthentication(client, {
                raw: {
                    ...raw,
                    response: {
                        clientDataJSON: bytes,
                        authenticatorData: bytes,
                        signature: bytes,
                        userHandle: bytes
                    }
                },
                uuid: "uuid"
            } as never)
        ).toEqual(success)
        expect(params[0]).toMatchObject({
            response: {
                clientDataJSON: "AQID",
                authenticatorData: "AQID",
                signature: "AQID",
                userHandle: "AQID"
            }
        })
        expect(params[1]).toEqual({ uuid: "uuid" })
    })
})
