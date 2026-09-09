import {
    Erc7579,
    erc7579Actions,
    type SafeSmartAccount,
    SmartAccountClient
} from "permissionless"
import { http } from "viem"
import { sepolia } from "viem/chains"
import type { SmartAccount } from "viem/erc4337"
import type { Address, Hex } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const safeAccount: SafeSmartAccount.ReturnType
declare const address: Address.Address
declare const data: Hex.Hex

const client = SmartAccountClient.create({
    account: safeAccount,
    chain: sepolia,
    bundlerTransport: http("https://bundler.invalid")
})
const accountless = SmartAccountClient.create({
    chain: sepolia,
    bundlerTransport: http("https://bundler.invalid")
})

describe("Erc7579", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof Erc7579>().toEqualTypeOf<
            | "accountId"
            | "decodeCalls"
            | "encodeCalls"
            | "encodeInstallModule"
            | "encodeUninstallModule"
            | "installModule"
            | "installModules"
            | "isModuleInstalled"
            | "supportsExecutionMode"
            | "supportsModule"
            | "uninstallModule"
            | "uninstallModules"
        >()
        expectTypeOf<Erc7579.Actions<SmartAccount.SmartAccount>>().not.toBeAny()
        expectTypeOf<Erc7579.CallType>().toEqualTypeOf<
            "call" | "delegatecall" | "batchcall"
        >()
        expectTypeOf<Erc7579.ModuleType>().toEqualTypeOf<
            "validator" | "executor" | "fallback" | "hook"
        >()
        expectTypeOf<Erc7579.ExecutionMode<"call">>().toEqualTypeOf<{
            type: "call"
            revertOnError?: boolean
            selector?: Hex.Hex
            context?: Hex.Hex
        }>()
        expectTypeOf<Erc7579.EncodeCallsParameters<"batchcall">>().not.toBeAny()
        expectTypeOf<Erc7579.DecodeCallsReturnType>().not.toBeAny()
        expectTypeOf<
            Erc7579.EncodeInstallModuleParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.EncodeUninstallModuleParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.InstallModuleParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.InstallModulesParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.IsModuleInstalledParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.SupportsExecutionModeParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.SupportsModuleParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.UninstallModuleParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
        expectTypeOf<
            Erc7579.UninstallModulesParameters<SmartAccount.SmartAccount>
        >().not.toBeAny()
    })

    test("module actions take the module type, address and one of context or initData", () => {
        Erc7579.installModule(client, {
            type: "validator",
            address,
            context: data
        })
        Erc7579.installModule(client, {
            type: "executor",
            address,
            initData: data,
            maxFeePerGas: 1n,
            maxPriorityFeePerGas: 1n,
            nonce: 0n,
            paymaster: true,
            paymasterContext: { sponsorshipPolicyId: "sp_x" }
        })
        expectTypeOf(
            Erc7579.installModule
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        Erc7579.installModules(client, {
            modules: [{ type: "hook", address, initData: data }]
        })
        Erc7579.uninstallModule(client, {
            type: "fallback",
            address,
            deInitData: data
        })
        Erc7579.uninstallModules(client, {
            modules: { type: "validator", address, context: data }
        })
        Erc7579.isModuleInstalled(client, {
            type: "validator",
            address,
            context: data
        })
        expectTypeOf(
            Erc7579.isModuleInstalled
        ).returns.resolves.toEqualTypeOf<boolean>()
        Erc7579.supportsModule(client, { type: "hook" })
        Erc7579.supportsExecutionMode(client, {
            type: "batchcall",
            revertOnError: true
        })
        Erc7579.accountId(client)
        expectTypeOf(Erc7579.accountId).returns.resolves.toEqualTypeOf<string>()
        // @ts-expect-error context and initData are exclusive
        Erc7579.installModule(client, {
            type: "validator",
            address,
            context: data,
            initData: data
        })
        // @ts-expect-error
        Erc7579.supportsModule(client, { type: "signer" })
        Erc7579.accountId(accountless, { account: safeAccount })
    })

    test("encoders", () => {
        expectTypeOf(Erc7579.encodeCalls).toBeCallableWith({
            mode: { type: "call" },
            callData: [{ to: address, value: 0n, data }]
        })
        expectTypeOf(Erc7579.encodeCalls).returns.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(Erc7579.decodeCalls).parameter(0).toEqualTypeOf<Hex.Hex>()
        expectTypeOf(
            Erc7579.decodeCalls
        ).returns.toEqualTypeOf<Erc7579.DecodeCallsReturnType>()
        expectTypeOf<Erc7579.DecodeCallsReturnType["mode"]>().toEqualTypeOf<
            Erc7579.ExecutionMode<Erc7579.CallType>
        >()
        expectTypeOf(Erc7579.encodeInstallModule).toBeCallableWith({
            account: safeAccount,
            modules: [{ type: "validator", address, initData: data }]
        })
        expectTypeOf(Erc7579.encodeUninstallModule).toBeCallableWith({
            account: safeAccount,
            modules: { type: "validator", address, deInitData: data }
        })
        expectTypeOf(Erc7579.encodeInstallModule).returns.toExtend<
            readonly { to: Address.Address; value: bigint; data: Hex.Hex }[]
        >()
        expectTypeOf(Erc7579.encodeUninstallModule).returns.toExtend<
            readonly { to: Address.Address; value: bigint; data: Hex.Hex }[]
        >()
    })

    test("erc7579Actions decorates a SmartAccountClient", () => {
        const decorated = client.extend(erc7579Actions())
        expectTypeOf(decorated.installModule).toBeFunction()
        expectTypeOf(
            decorated.accountId
        ).returns.resolves.toEqualTypeOf<string>()
        decorated.installModule({ type: "validator", address, context: data })
        decorated.isModuleInstalled({
            type: "validator",
            address,
            context: data
        })
        expectTypeOf(decorated.installModule)
            .parameter(0)
            .toExtend<
                Erc7579.InstallModuleParameters<SafeSmartAccount.ReturnType>
            >()
        expectTypeOf(erc7579Actions()(client)).toExtend<
            Erc7579.Actions<SafeSmartAccount.ReturnType>
        >()
        expectTypeOf<
            keyof Erc7579.Actions<SafeSmartAccount.ReturnType>
        >().toEqualTypeOf<
            | "accountId"
            | "installModule"
            | "installModules"
            | "isModuleInstalled"
            | "supportsExecutionMode"
            | "supportsModule"
            | "uninstallModule"
            | "uninstallModules"
        >()
    })
})
