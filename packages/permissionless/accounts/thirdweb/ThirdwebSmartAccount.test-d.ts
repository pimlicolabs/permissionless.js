import { type SmartAccountClient, ThirdwebSmartAccount } from "permissionless"
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

describe("ThirdwebSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<
            keyof typeof ThirdwebSmartAccount
        >().toEqualTypeOf<"from">()
        expectTypeOf<ThirdwebSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<ThirdwebSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<ThirdwebSmartAccount.Implementation>().not.toBeAny()
        expectTypeOf<ThirdwebSmartAccount.Version>().toEqualTypeOf<"1.5.20">()
    })

    test("from: owner singular, EntryPoint 0.6 | 0.7, utf-8 salt", () => {
        ThirdwebSmartAccount.from({ client, owner })
        ThirdwebSmartAccount.from({
            client,
            owner: walletClient
        })
        ThirdwebSmartAccount.from({
            client,
            owner: provider
        })
        ThirdwebSmartAccount.from({
            client,
            owner,
            entryPoint: "0.6",
            version: "1.5.20",
            salt: "1",
            address,
            factoryAddress: address,
            nonceKey: 7n
        })
        ThirdwebSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
        })
        expectTypeOf<ThirdwebSmartAccount.Parameters["salt"]>().toEqualTypeOf<
            string | undefined
        >()
        // @ts-expect-error
        ThirdwebSmartAccount.from({ client, owners: [owner] })
        // @ts-expect-error Thirdweb stops at EntryPoint 0.7
        ThirdwebSmartAccount.from({ client, owner, entryPoint: "0.8" })
        ThirdwebSmartAccount.from({
            client,
            owner,
            // @ts-expect-error dropped in 1.0 (never read)
            secp256k1VerificationFacetAddress: address
        })
    })

    test("from: return type", () => {
        expectTypeOf(
            ThirdwebSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<ThirdwebSmartAccount.ReturnType<"0.7">>()
        expectTypeOf(
            ThirdwebSmartAccount.from({ client, owner })
        ).resolves.toEqualTypeOf<ThirdwebSmartAccount.ReturnType>()
        expectTypeOf(
            ThirdwebSmartAccount.from({ client, owner, entryPoint: "0.6" })
        ).resolves.toEqualTypeOf<ThirdwebSmartAccount.ReturnType<"0.6">>()
        expectTypeOf<ThirdwebSmartAccount.ReturnType>().toEqualTypeOf<
            SmartAccount.SmartAccount<ThirdwebSmartAccount.Implementation>
        >()
        expectTypeOf<ThirdwebSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            ThirdwebSmartAccount.ReturnType<"0.6">["entryPoint"]["version"]
        >().toEqualTypeOf<"0.6">()
        expectTypeOf<
            ThirdwebSmartAccount.ReturnType["decodeCalls"]
        >().toBeFunction()
        expectTypeOf<ThirdwebSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<ThirdwebSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })
})
