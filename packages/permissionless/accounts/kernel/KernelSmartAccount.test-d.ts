import { KernelSmartAccount, type SmartAccountClient } from "permissionless"
import type { Account, Chain, Client } from "viem"
import {
    EntryPoint,
    type SmartAccount,
    type WebAuthnAccount
} from "viem/erc4337"
import type { Address, Hex, TypedData } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const client: Client.Client
declare const owner: Account.Local
declare const walletClient: Client.Client<
    Chain.Chain | undefined,
    Account.Account
>
declare const webAuthnAccount: WebAuthnAccount.Account
declare const provider: {
    request(args: { method: string; params?: unknown }): Promise<unknown>
}
declare const address: Address.Address
declare const hash: Hex.Hex
declare const typedData: TypedData.Definition

describe("KernelSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof KernelSmartAccount>().toEqualTypeOf<
            | "from"
            | "getVersion"
            | "signMessage"
            | "signTypedData"
            | "wrapMessageHash"
        >()
        expectTypeOf<KernelSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<KernelSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<KernelSmartAccount.Implementation>().not.toBeAny()
        expectTypeOf<KernelSmartAccount.Version>().toEqualTypeOf<
            | "0.2.1"
            | "0.2.2"
            | "0.2.3"
            | "0.2.4"
            | "0.3.0-beta"
            | "0.3.1"
            | "0.3.2"
            | "0.3.3"
        >()
        expectTypeOf<KernelSmartAccount.Version<"0.6">>().toEqualTypeOf<
            "0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"
        >()
        expectTypeOf<KernelSmartAccount.Version<"0.7">>().toEqualTypeOf<
            "0.3.0-beta" | "0.3.1" | "0.3.2" | "0.3.3"
        >()
    })

    test("from: owner singular in both modes, version follows the EntryPoint", () => {
        KernelSmartAccount.from({ client, owner })
        KernelSmartAccount.from({
            client,
            owner: walletClient
        })
        KernelSmartAccount.from({
            client,
            owner: provider
        })
        KernelSmartAccount.from({
            client,
            owner: webAuthnAccount,
            validatorAddress: address
        })
        KernelSmartAccount.from({
            client,
            owner,
            entryPoint: "0.6",
            version: "0.2.2",
            index: 1n,
            nonceKey: 7n,
            useMetaFactory: "optional",
            factoryAddress: address,
            metaFactoryAddress: address,
            implementation: address,
            address
        })
        KernelSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
            version: "0.3.1"
        })
        KernelSmartAccount.from({
            client,
            owner,
            eip7702: true,
            version: "0.3.3"
        })
        expectTypeOf<
            KernelSmartAccount.Parameters<"0.6">["entryPoint"]
        >().toEqualTypeOf<
            "0.6" | { address: Address.Address; version: "0.6" } | undefined
        >()
        expectTypeOf<
            KernelSmartAccount.Parameters<"0.6">["version"]
        >().toEqualTypeOf<KernelSmartAccount.Version<"0.6"> | undefined>()
        // @ts-expect-error the tuple ceremony is gone
        KernelSmartAccount.from({ client, owners: [owner] })
        // @ts-expect-error Kernel stops at EntryPoint 0.7
        KernelSmartAccount.from({ client, owner, entryPoint: "0.8" })
        KernelSmartAccount.from({
            client,
            owner,
            entryPoint: "0.7",
            // @ts-expect-error v2 versions live on EntryPoint 0.6
            version: "0.2.2"
        })
    })

    test("from: return type", () => {
        expectTypeOf(
            KernelSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<KernelSmartAccount.ReturnType<"0.7", false>>()
        expectTypeOf(
            KernelSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<KernelSmartAccount.ReturnType>()
        expectTypeOf(
            KernelSmartAccount.from({ client, owner, entryPoint: "0.6" })
        ).resolves.toEqualTypeOf<KernelSmartAccount.ReturnType<"0.6">>()
        expectTypeOf(
            KernelSmartAccount.from({ client, owner, eip7702: true })
        ).resolves.toEqualTypeOf<KernelSmartAccount.ReturnType<"0.7", true>>()
        expectTypeOf<KernelSmartAccount.ReturnType>().toEqualTypeOf<
            SmartAccount.SmartAccount<KernelSmartAccount.Implementation>
        >()
        expectTypeOf<KernelSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            KernelSmartAccount.ReturnType["entryPoint"]["version"]
        >().toEqualTypeOf<"0.7">()
        expectTypeOf<KernelSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<
            KernelSmartAccount.ReturnType<"0.7", true>["authorization"]
        >().toEqualTypeOf<{
            account: Account.PrivateKey
            address: Address.Address
        }>()
        expectTypeOf<
            KernelSmartAccount.ReturnType<"0.7", true>["implementation"]
        >().toEqualTypeOf<Address.Address>()
        expectTypeOf<KernelSmartAccount.ReturnType>().not.toHaveProperty(
            "implementation"
        )
        expectTypeOf<KernelSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })

    test("namespace helpers", () => {
        expectTypeOf(KernelSmartAccount.getVersion).toBeCallableWith(client, {
            address
        })
        expectTypeOf(
            KernelSmartAccount.getVersion
        ).returns.resolves.toEqualTypeOf<KernelSmartAccount.Version | null>()
        expectTypeOf(KernelSmartAccount.wrapMessageHash).toBeCallableWith({
            hash,
            address,
            version: "0.3.1",
            chainId: 1
        })
        expectTypeOf(
            KernelSmartAccount.wrapMessageHash
        ).returns.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(KernelSmartAccount.signMessage).toBeCallableWith({
            message: "hello",
            owner,
            address,
            version: "0.3.1",
            chainId: 1
        })
        expectTypeOf(
            KernelSmartAccount.signMessage
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(KernelSmartAccount.signTypedData).toBeCallableWith({
            typedData,
            owner: webAuthnAccount,
            address,
            version: "0.3.3",
            chainId: 1,
            eip7702: true
        })
        expectTypeOf(
            KernelSmartAccount.signTypedData
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
    })
})
