import { EtherspotSmartAccount, type SmartAccountClient } from "permissionless"
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

describe("EtherspotSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<
            keyof typeof EtherspotSmartAccount
        >().toEqualTypeOf<"from">()
        expectTypeOf<EtherspotSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<EtherspotSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<EtherspotSmartAccount.Implementation>().not.toBeAny()
    })

    test("from: owner singular, EntryPoint 0.7 only and optional", () => {
        EtherspotSmartAccount.from({ client, owner })
        EtherspotSmartAccount.from({
            client,
            owner: walletClient
        })
        EtherspotSmartAccount.from({
            client,
            owner: provider
        })
        EtherspotSmartAccount.from({
            client,
            owner,
            entryPoint: "0.7",
            address,
            index: 1n,
            nonceKey: 7n,
            metaFactoryAddress: address,
            bootstrapAddress: address,
            validatorAddress: address
        })
        EtherspotSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
        })
        expectTypeOf<
            EtherspotSmartAccount.Parameters["entryPoint"]
        >().toEqualTypeOf<
            "0.7" | { address: Address.Address; version: "0.7" } | undefined
        >()
        // @ts-expect-error the tuple ceremony is gone
        EtherspotSmartAccount.from({ client, owners: [owner] })
        // @ts-expect-error Etherspot is EntryPoint 0.7 only
        EtherspotSmartAccount.from({ client, owner, entryPoint: "0.6" })
    })

    test("from: return type", () => {
        expectTypeOf(
            EtherspotSmartAccount.from
        ).returns.resolves.toEqualTypeOf<EtherspotSmartAccount.ReturnType>()
        expectTypeOf<EtherspotSmartAccount.ReturnType>().toEqualTypeOf<
            SmartAccount.SmartAccount<EtherspotSmartAccount.Implementation>
        >()
        expectTypeOf<EtherspotSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            EtherspotSmartAccount.ReturnType["entryPoint"]["version"]
        >().toEqualTypeOf<"0.7">()
        expectTypeOf<
            EtherspotSmartAccount.ReturnType["entryPoint"]["abi"]
        >().toEqualTypeOf<typeof EntryPoint.abiV07>()
        expectTypeOf<EtherspotSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<EtherspotSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })
})
