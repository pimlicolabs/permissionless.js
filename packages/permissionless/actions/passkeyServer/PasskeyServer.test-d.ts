import { PasskeyServer, PasskeyServerClient } from "permissionless/pimlico"
import { http } from "viem"
import type { Hex, WebAuthn } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const credential: WebAuthn.P256Credential
const client = PasskeyServerClient.create({
    transport: http("https://passkeys.invalid")
})

describe("PasskeyServer", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof PasskeyServer>().toEqualTypeOf<
            | "getCredentials"
            | "startAuthentication"
            | "startRegistration"
            | "verifyAuthentication"
            | "verifyRegistration"
        >()
        expectTypeOf<PasskeyServer.Actions>().not.toBeAny()
        expectTypeOf<PasskeyServer.GetCredentialsParameters>().toEqualTypeOf<{
            context?: Record<string, unknown>
        }>()
        expectTypeOf<PasskeyServer.GetCredentialsReturnType>().toEqualTypeOf<
            { id: string; publicKey: Hex.Hex }[]
        >()
        expectTypeOf<PasskeyServer.StartRegistrationParameters>().toEqualTypeOf<{
            context?: Record<string, unknown>
        }>()
        expectTypeOf<PasskeyServer.StartRegistrationReturnType>().not.toBeAny()
        expectTypeOf<PasskeyServer.VerifyRegistrationParameters>().toEqualTypeOf<{
            credential: WebAuthn.P256Credential
            context: unknown
        }>()
        expectTypeOf<PasskeyServer.VerifyRegistrationReturnType>().toEqualTypeOf<{
            success: boolean
            id: string
            publicKey: Hex.Hex
            userName: string
        }>()
        expectTypeOf<PasskeyServer.StartAuthenticationReturnType>().toEqualTypeOf<{
            challenge: string
            rpId: string
            userVerification?: string
            uuid: string
        }>()
        expectTypeOf<PasskeyServer.VerifyAuthenticationParameters>().toHaveProperty(
            "raw"
        )
        expectTypeOf<PasskeyServer.VerifyAuthenticationParameters>().toHaveProperty(
            "uuid"
        )
        expectTypeOf<PasskeyServer.VerifyAuthenticationReturnType>().toEqualTypeOf<PasskeyServer.VerifyRegistrationReturnType>()
    })

    test("actions take a client with request", () => {
        expectTypeOf(PasskeyServer.startRegistration).toBeCallableWith(client, {
            context: { userName: "alice" }
        })
        expectTypeOf(PasskeyServer.verifyRegistration).toBeCallableWith(
            client,
            {
                credential,
                context: { userName: "alice" }
            }
        )
        expectTypeOf(PasskeyServer.startAuthentication).toBeCallableWith(client)
        expectTypeOf(PasskeyServer.getCredentials).toBeCallableWith(client)
        expectTypeOf(PasskeyServer.getCredentials).toBeCallableWith(client, {
            context: { userName: "alice" }
        })
        expectTypeOf(PasskeyServer.verifyAuthentication)
            .parameter(1)
            .toEqualTypeOf<PasskeyServer.VerifyAuthenticationParameters>()
        expectTypeOf<keyof PasskeyServer.Actions>().toEqualTypeOf<
            | "~schema"
            | "startRegistration"
            | "verifyRegistration"
            | "startAuthentication"
            | "verifyAuthentication"
            | "getCredentials"
        >()
    })
})
