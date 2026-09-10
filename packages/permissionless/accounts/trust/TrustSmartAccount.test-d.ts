import { type SmartAccountClient, TrustSmartAccount } from "permissionless"
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

describe("TrustSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof TrustSmartAccount>().toEqualTypeOf<"from">()
        expectTypeOf<TrustSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<TrustSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<TrustSmartAccount.Implementation>().not.toBeAny()
    })

    test("from: owner singular, EntryPoint 0.6 only and optional", () => {
        TrustSmartAccount.from({ client, owner })
        TrustSmartAccount.from({
            client,
            owner: walletClient
        })
        TrustSmartAccount.from({
            client,
            owner: provider
        })
        TrustSmartAccount.from({
            client,
            owner,
            entryPoint: "0.6",
            address,
            factoryAddress: address,
            index: 1n,
            nonceKey: 7n,
            secp256k1VerificationFacetAddress: address
        })
        TrustSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV06, version: "0.6" }
        })
        expectTypeOf<
            TrustSmartAccount.Parameters["entryPoint"]
        >().toEqualTypeOf<
            "0.6" | { address: Address.Address; version: "0.6" } | undefined
        >()
        // @ts-expect-error
        TrustSmartAccount.from({ client, owners: [owner] })
        // @ts-expect-error Trust is EntryPoint 0.6 only
        TrustSmartAccount.from({ client, owner, entryPoint: "0.7" })
    })

    test("from: return type", () => {
        expectTypeOf(
            TrustSmartAccount.from
        ).returns.resolves.toEqualTypeOf<TrustSmartAccount.ReturnType>()
        expectTypeOf<TrustSmartAccount.ReturnType>().toEqualTypeOf<
            SmartAccount.SmartAccount<TrustSmartAccount.Implementation>
        >()
        expectTypeOf<TrustSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            TrustSmartAccount.ReturnType["entryPoint"]["version"]
        >().toEqualTypeOf<"0.6">()
        expectTypeOf<
            TrustSmartAccount.ReturnType["entryPoint"]["abi"]
        >().toEqualTypeOf<typeof EntryPoint.abiV06>()
        expectTypeOf<TrustSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<TrustSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })
})
