import { SimpleSmartAccount, type SmartAccountClient } from "permissionless"
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

describe("SimpleSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof SimpleSmartAccount>().toEqualTypeOf<"from">()
        expectTypeOf<SimpleSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<SimpleSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<SimpleSmartAccount.Implementation>().not.toBeAny()
    })

    test("from: owner arms, optional entryPoint (shorthand or object)", () => {
        SimpleSmartAccount.from({ client, owner })
        SimpleSmartAccount.from({
            client,
            owner: walletClient
        })
        SimpleSmartAccount.from({
            client,
            owner: provider
        })
        SimpleSmartAccount.from({
            client,
            owner,
            entryPoint: "0.6",
            factoryAddress: address,
            index: 1n,
            nonceKey: 7n,
            address
        })
        SimpleSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
        })
        SimpleSmartAccount.from({
            client,
            owner,
            entryPoint: "0.9",
            factoryAddress: address
        })
        expectTypeOf<
            SimpleSmartAccount.Parameters<"0.6">["entryPoint"]
        >().toEqualTypeOf<
            "0.6" | { address: Address.Address; version: "0.6" } | undefined
        >()
    })

    test("from: the default EntryPoint is 0.8", () => {
        expectTypeOf(
            SimpleSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<SimpleSmartAccount.ReturnType<"0.8", false>>()
        expectTypeOf(
            SimpleSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<SimpleSmartAccount.ReturnType>()
        expectTypeOf(
            SimpleSmartAccount.from({ client, owner, entryPoint: "0.6" })
        ).resolves.toEqualTypeOf<SimpleSmartAccount.ReturnType<"0.6">>()
    })

    test("from: return type is viem's SmartAccount over the Implementation", () => {
        expectTypeOf<SimpleSmartAccount.ReturnType<"0.7">>().toEqualTypeOf<
            SmartAccount.SmartAccount<SimpleSmartAccount.Implementation<"0.7">>
        >()
        expectTypeOf<SimpleSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            SimpleSmartAccount.ReturnType<"0.6">["entryPoint"]["version"]
        >().toEqualTypeOf<"0.6">()
        expectTypeOf<
            SimpleSmartAccount.ReturnType<"0.6">["entryPoint"]["abi"]
        >().toEqualTypeOf<typeof EntryPoint.abiV06>()
        expectTypeOf<
            SimpleSmartAccount.ReturnType["type"]
        >().toEqualTypeOf<"smart">()
        expectTypeOf<SimpleSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<SimpleSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })

    test("eip7702 mode: EntryPoint 0.8 | 0.9, implementation replaces the factory", () => {
        SimpleSmartAccount.from({
            client,
            owner,
            eip7702: true
        })
        SimpleSmartAccount.from({
            client,
            owner,
            eip7702: true,
            entryPoint: "0.9",
            implementation: address
        })
        expectTypeOf<"0.9">().toExtend<
            SimpleSmartAccount.Parameters<"0.9", true>["entryPoint"]
        >()
        expectTypeOf<"0.7">().not.toExtend<
            SimpleSmartAccount.Parameters<"0.8", true>["entryPoint"]
        >()
        expectTypeOf<
            SimpleSmartAccount.Parameters<"0.8", true>["factoryAddress"]
        >().toEqualTypeOf<undefined>()
        expectTypeOf<
            SimpleSmartAccount.Parameters<"0.8", false>["implementation"]
        >().toEqualTypeOf<undefined>()
        expectTypeOf(
            SimpleSmartAccount.from({ client, owner, eip7702: true })
        ).resolves.toEqualTypeOf<SimpleSmartAccount.ReturnType<"0.8", true>>()
        expectTypeOf<
            SimpleSmartAccount.ReturnType<"0.8", true>["authorization"]
        >().toEqualTypeOf<{
            account: Account.PrivateKey
            address: Address.Address
        }>()
        expectTypeOf<
            SimpleSmartAccount.ReturnType<"0.8", false>["authorization"]
        >().toEqualTypeOf<undefined>()
        SimpleSmartAccount.from({
            client,
            owner,
            eip7702: true,
            // @ts-expect-error 7702 needs EntryPoint 0.8+
            entryPoint: "0.7"
        })
        SimpleSmartAccount.from({
            client,
            owner,
            eip7702: true,
            // @ts-expect-error factoryAddress has no meaning in 7702 mode
            factoryAddress: address
        })
    })

    test("from: rejects unknown owners and EntryPoint versions", () => {
        // @ts-expect-error
        SimpleSmartAccount.from({ client, owner: address })
        // @ts-expect-error
        SimpleSmartAccount.from({ client, owner, entryPoint: "0.5" })
        // @ts-expect-error owners is Safe's spelling
        SimpleSmartAccount.from({ client, owners: [owner] })
    })
})
