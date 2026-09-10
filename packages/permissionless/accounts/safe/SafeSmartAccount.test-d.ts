import { SafeSmartAccount, type SmartAccountClient } from "permissionless"
import type { Account, Chain, Client } from "viem"
import {
    EntryPoint,
    type SmartAccount,
    type WebAuthnAccount
} from "viem/erc4337"
import type { Address, Hex } from "viem/utils"
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

describe("SafeSmartAccount", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof SafeSmartAccount>().toEqualTypeOf<
            "from" | "signUserOperation"
        >()
        expectTypeOf<SafeSmartAccount.Parameters>().not.toBeAny()
        expectTypeOf<SafeSmartAccount.ReturnType>().not.toBeAny()
        expectTypeOf<SafeSmartAccount.Implementation>().not.toBeAny()
        expectTypeOf<SafeSmartAccount.Version>().toEqualTypeOf<
            "1.4.1" | "1.5.0"
        >()
        expectTypeOf<SafeSmartAccount.SignUserOperationParameters>().not.toBeAny()
    })

    test("from: owners stays plural, entryPoint and version optional", () => {
        SafeSmartAccount.from({
            client,
            owners: [owner]
        })
        SafeSmartAccount.from({
            client,
            owners: [owner, walletClient, provider],
            threshold: 2n
        })
        SafeSmartAccount.from({
            client,
            owners: [webAuthnAccount, owner],
            safeWebAuthnSharedSignerAddress: address
        })
        SafeSmartAccount.from({
            client,
            owners: [owner],
            entryPoint: "0.6",
            version: "1.4.1",
            address,
            saltNonce: 1n,
            nonceKey: 7n,
            validUntil: 1,
            validAfter: 0,
            paymentToken: address,
            payment: 0n,
            paymentReceiver: address,
            onchainIdentifier: "0x",
            useMultiSendForSetup: true
        })
        SafeSmartAccount.from({
            client,
            owners: [owner],
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
            erc7579LaunchpadAddress: address,
            attesters: [address],
            attestersThreshold: 1,
            validators: [{ address, context: "0x" }]
        })
        expectTypeOf<
            SafeSmartAccount.Parameters<"0.6">["entryPoint"]
        >().toEqualTypeOf<
            "0.6" | { address: Address.Address; version: "0.6" } | undefined
        >()
        expectTypeOf<SafeSmartAccount.Parameters["version"]>().toEqualTypeOf<
            SafeSmartAccount.Version | undefined
        >()
        // @ts-expect-error owner is singular everywhere except Safe
        SafeSmartAccount.from({ client, owner })
        // @ts-expect-error Safe stops at EntryPoint 0.7
        SafeSmartAccount.from({ client, owners: [owner], entryPoint: "0.8" })
        SafeSmartAccount.from({
            client,
            owners: [owner],
            // @ts-expect-error setupTransactions is gone (spec §10)
            setupTransactions: []
        })
    })

    test("from: return type", () => {
        expectTypeOf(
            SafeSmartAccount.from({ client, owners: [owner] })
        ).resolves.toEqualTypeOf<SafeSmartAccount.ReturnType<"0.7">>()
        expectTypeOf(
            SafeSmartAccount.from({ client, owners: [owner] })
        ).resolves.toEqualTypeOf<SafeSmartAccount.ReturnType>()
        expectTypeOf(
            SafeSmartAccount.from({
                client,
                owners: [owner],
                entryPoint: "0.6"
            })
        ).resolves.toEqualTypeOf<SafeSmartAccount.ReturnType<"0.6">>()
        expectTypeOf<SafeSmartAccount.ReturnType>().toEqualTypeOf<
            SmartAccount.SmartAccount<SafeSmartAccount.Implementation>
        >()
        expectTypeOf<SafeSmartAccount.ReturnType>().toExtend<SmartAccount.SmartAccount>()
        expectTypeOf<
            SafeSmartAccount.ReturnType["entryPoint"]["version"]
        >().toEqualTypeOf<"0.7">()
        expectTypeOf<
            SafeSmartAccount.ReturnType["decodeCalls"]
        >().toBeFunction()
        expectTypeOf<SafeSmartAccount.ReturnType["sign"]>().toBeFunction()
        expectTypeOf<
            SafeSmartAccount.ReturnType["authorization"]
        >().toEqualTypeOf<undefined>()
        expectTypeOf<SafeSmartAccount.ReturnType>().toExtend<
            NonNullable<SmartAccountClient.Config["account"]>
        >()
    })

    test("signUserOperation rides the namespace", () => {
        expectTypeOf(SafeSmartAccount.signUserOperation)
            .parameter(0)
            .toEqualTypeOf<SafeSmartAccount.SignUserOperationParameters>()
        expectTypeOf(
            SafeSmartAccount.signUserOperation
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        expectTypeOf<SafeSmartAccount.SignUserOperationParameters>().toHaveProperty(
            "owners"
        )
        expectTypeOf<SafeSmartAccount.SignUserOperationParameters>().toHaveProperty(
            "account"
        )
        expectTypeOf<SafeSmartAccount.SignUserOperationParameters>().toHaveProperty(
            "chainId"
        )
    })
})
