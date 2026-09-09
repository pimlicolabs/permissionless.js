import { LightSmartAccount, type SmartAccountClient } from "permissionless"
import type { Account, Chain, Client } from "viem"
import { EntryPoint, type SmartAccount } from "viem/erc4337"
import type { Address } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const client: Client.Client
declare const owner: Account.Local
declare const walletClient: Client.Client<
    Chain.Chain | undefined,
    Account.Account
>
declare const provider: {
    request(args: { method: string; params?: unknown }): Promise<unknown>
}
declare const address: Address.Address

describe("LightSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof LightSmartAccount>().toEqualTypeOf<"from">()
        expectTypeOf<LightSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<LightSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<LightSmartAccount.Implementation>().not.toBeAny()
        expectTypeOf<LightSmartAccount.Version>().toEqualTypeOf<
            "1.1.0" | "2.0.0"
        >()
        expectTypeOf<
            LightSmartAccount.Version<"0.6">
        >().toEqualTypeOf<"1.1.0">()
        expectTypeOf<
            LightSmartAccount.Version<"0.7">
        >().toEqualTypeOf<"2.0.0">()
    })

    test("from: owner singular, version bound to the EntryPoint", () => {
        LightSmartAccount.from({ client, owner })
        LightSmartAccount.from({
            client,
            owner: walletClient
        })
        LightSmartAccount.from({
            client,
            owner: provider
        })
        LightSmartAccount.from({
            client,
            owner,
            entryPoint: "0.6",
            version: "1.1.0",
            address,
            factoryAddress: address,
            index: 1n,
            nonceKey: 7n
        })
        LightSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
            version: "2.0.0"
        })
        expectTypeOf<
            LightSmartAccount.Parameters<"0.6">["entryPoint"]
        >().toEqualTypeOf<
            "0.6" | { address: Address.Address; version: "0.6" } | undefined
        >()
        expectTypeOf<
            LightSmartAccount.Parameters<"0.6">["version"]
        >().toEqualTypeOf<"1.1.0" | undefined>()
        // @ts-expect-error
        LightSmartAccount.from({ client, owners: [owner] })
        // @ts-expect-error Light stops at EntryPoint 0.7
        LightSmartAccount.from({ client, owner, entryPoint: "0.8" })
        LightSmartAccount.from({
            client,
            owner,
            entryPoint: "0.7",
            // @ts-expect-error 1.1.0 lives on EntryPoint 0.6
            version: "1.1.0"
        })
    })

    test("from: return type", () => {
        expectTypeOf(
            LightSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<LightSmartAccount.ReturnType<"0.7">>()
        expectTypeOf(
            LightSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<LightSmartAccount.ReturnType>()
        expectTypeOf(
            LightSmartAccount.from({ client, owner, entryPoint: "0.6" })
        ).resolves.toEqualTypeOf<LightSmartAccount.ReturnType<"0.6">>()
        expectTypeOf<LightSmartAccount.ReturnType<"0.6">>().toEqualTypeOf<
            SmartAccount.SmartAccount<LightSmartAccount.Implementation<"0.6">>
        >()
        expectTypeOf<LightSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            LightSmartAccount.ReturnType<"0.6">["entryPoint"]["version"]
        >().toEqualTypeOf<"0.6">()
        expectTypeOf<LightSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<LightSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })
})
