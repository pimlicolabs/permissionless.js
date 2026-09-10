import { NexusSmartAccount, type SmartAccountClient } from "permissionless"
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

describe("NexusSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof NexusSmartAccount>().toEqualTypeOf<"from">()
        expectTypeOf<NexusSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<NexusSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<NexusSmartAccount.Implementation>().not.toBeAny()
        expectTypeOf<NexusSmartAccount.Version>().toEqualTypeOf<"1.0.0">()
    })

    test("from: owner singular, EntryPoint 0.7 only, attesters and nonceKey", () => {
        NexusSmartAccount.from({ client, owner })
        NexusSmartAccount.from({
            client,
            owner: walletClient
        })
        NexusSmartAccount.from({
            client,
            owner: provider
        })
        NexusSmartAccount.from({
            client,
            owner,
            entryPoint: "0.7",
            version: "1.0.0",
            address,
            index: 1n,
            factoryAddress: address,
            validatorAddress: address,
            attesters: [address],
            threshold: 1,
            nonceKey: 7n
        })
        NexusSmartAccount.from({
            client,
            owner,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
        })
        expectTypeOf<
            NexusSmartAccount.Parameters["entryPoint"]
        >().toEqualTypeOf<
            "0.7" | { address: Address.Address; version: "0.7" } | undefined
        >()
        // @ts-expect-error the tuple ceremony is gone
        NexusSmartAccount.from({ client, owners: [owner] })
        // @ts-expect-error Nexus is EntryPoint 0.7 only
        NexusSmartAccount.from({ client, owner, entryPoint: "0.6" })
        // @ts-expect-error
        NexusSmartAccount.from({ client, owner, version: "1.1.0" })
    })

    test("from: return type", () => {
        expectTypeOf(
            NexusSmartAccount.from
        ).returns.resolves.toEqualTypeOf<NexusSmartAccount.ReturnType>()
        expectTypeOf<NexusSmartAccount.ReturnType>().toEqualTypeOf<
            SmartAccount.SmartAccount<NexusSmartAccount.Implementation>
        >()
        expectTypeOf<NexusSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            NexusSmartAccount.ReturnType["entryPoint"]["version"]
        >().toEqualTypeOf<"0.7">()
        expectTypeOf<
            NexusSmartAccount.ReturnType["entryPoint"]["abi"]
        >().toEqualTypeOf<typeof EntryPoint.abiV07>()
        expectTypeOf<
            NexusSmartAccount.ReturnType["decodeCalls"]
        >().toBeFunction()
        expectTypeOf<NexusSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<NexusSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })
})
