import { type PasskeyServer, PasskeyServerClient } from "permissionless/pimlico"
import { type Account, type Chain, type Client, http } from "viem"
import type { RpcSchema } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

type CustomSchema = RpcSchema.From<{
    Request: { method: "custom_method"; params: [value: string] }
    ReturnType: string
}>
declare const withSchema: PasskeyServerClient.Client<CustomSchema>
declare const plainViemClient: ReturnType<typeof Client.create>

describe("PasskeyServerClient", () => {
    test("namespace names", () => {
        expectTypeOf<
            keyof typeof PasskeyServerClient
        >().toEqualTypeOf<"create">()
        expectTypeOf<PasskeyServerClient.Client>().not.toBeAny()
        expectTypeOf<PasskeyServerClient.Config>().not.toBeAny()
        expectTypeOf<PasskeyServerClient.Schema>().not.toBeAny()
        expectTypeOf<PasskeyServerClient.Schema>().toExtend<RpcSchema.Generic>()
    })

    test("create returns the passkey server client with its actions", () => {
        const client = PasskeyServerClient.create({
            transport: http("https://passkeys.invalid")
        })
        expectTypeOf(client).toEqualTypeOf<PasskeyServerClient.Client>()
        expectTypeOf(
            client.startRegistration
        ).returns.resolves.toEqualTypeOf<PasskeyServer.StartRegistrationReturnType>()
        expectTypeOf(client.verifyRegistration)
            .parameter(0)
            .toEqualTypeOf<PasskeyServer.VerifyRegistrationParameters>()
        expectTypeOf(
            client.startAuthentication
        ).returns.resolves.toEqualTypeOf<PasskeyServer.StartAuthenticationReturnType>()
        expectTypeOf(client.verifyAuthentication)
            .parameter(0)
            .toEqualTypeOf<PasskeyServer.VerifyAuthenticationParameters>()
        expectTypeOf(
            client.getCredentials
        ).returns.resolves.toEqualTypeOf<PasskeyServer.GetCredentialsReturnType>()
        expectTypeOf(client.chain).toEqualTypeOf<Chain.Chain | undefined>()
        expectTypeOf(client.account).toEqualTypeOf<
            Account.Account | undefined
        >()
    })

    test("config is viem's client options", () => {
        expectTypeOf<keyof PasskeyServerClient.Config>().toEqualTypeOf<
            | "account"
            | "cacheTime"
            | "chain"
            | "key"
            | "name"
            | "pollingInterval"
            | "schema"
            | "transport"
        >()
        expectTypeOf(PasskeyServerClient.create).toBeCallableWith({
            transport: http("https://passkeys.invalid"),
            key: "passkeys",
            name: "Passkey Server",
            pollingInterval: 100
        })
    })

    test("a custom rpc schema still assigns to the bare alias (#500)", () => {
        const bare: PasskeyServerClient.Client = withSchema
        expectTypeOf(bare).toEqualTypeOf<PasskeyServerClient.Client>()
        expectTypeOf(plainViemClient).not.toExtend<PasskeyServerClient.Client>()
    })
})
