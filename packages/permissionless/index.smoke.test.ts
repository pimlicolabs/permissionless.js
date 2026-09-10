import { readFileSync } from "node:fs"
import * as permissionless from "permissionless"
import {
    Erc7579,
    EtherspotSmartAccount,
    erc7579Actions,
    KernelSmartAccount,
    LightSmartAccount,
    NexusSmartAccount,
    Nonce,
    Owner,
    SafeSmartAccount,
    SimpleSmartAccount,
    SmartAccountClient,
    smartAccountActions,
    ThirdwebSmartAccount,
    TrustSmartAccount
} from "permissionless"
import * as etherspot from "permissionless/etherspot"
import { Etherspot } from "permissionless/etherspot"
import * as experimental from "permissionless/experimental"
import * as pimlico from "permissionless/pimlico"
import {
    Erc20Paymaster,
    PasskeyServer,
    PasskeyServerClient,
    Pimlico,
    PimlicoClient,
    pimlicoActions
} from "permissionless/pimlico"
import type { Chain, Transport } from "viem"
import type { EntryPoint, SmartAccount } from "viem/erc4337"
import * as erc4337 from "viem/erc4337"
import { describe, expect, expectTypeOf, test } from "vitest"

const keys = (module: object) => Object.keys(module).sort()

const { exports: exportMap } = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8")
) as { exports: Record<string, unknown> }

const accountNamespaces = [
    "EtherspotSmartAccount",
    "KernelSmartAccount",
    "LightSmartAccount",
    "NexusSmartAccount",
    "SafeSmartAccount",
    "SimpleSmartAccount",
    "ThirdwebSmartAccount",
    "TrustSmartAccount"
] as const

const namespaces = [
    ...accountNamespaces,
    "SmartAccountClient",
    "Erc7579",
    "Nonce",
    "Owner",
    "PimlicoClient",
    "Pimlico",
    "PasskeyServerClient",
    "PasskeyServer",
    "Erc20Paymaster",
    "Etherspot"
]

describe("permissionless", () => {
    test("export map: five public entrypoints + the ./_types/* escape hatch", () => {
        expect(Object.keys(exportMap)).toEqual([
            ".",
            "./pimlico",
            "./etherspot",
            "./experimental",
            "./package.json",
            "./_types/*"
        ])
        expect(exportMap["./_types/*"]).toEqual({
            types: "./_types/*.d.ts",
            default: "./_esm/*.js"
        })
    })

    test("root exports", () => {
        expect(
            keys(permissionless).filter((k) => !k.endsWith("Error"))
        ).toEqual(
            [
                ...accountNamespaces,
                "Erc7579",
                "Nonce",
                "Owner",
                "SmartAccountClient",
                "erc7579Actions",
                "getAccountNonce",
                "getRequiredPrefund",
                "getSenderAddress",
                "sendTransaction",
                "signMessage",
                "signTypedData",
                "smartAccountActions",
                "writeContract"
            ].sort()
        )
        expect(permissionless.AccountNotFoundError).toBeTypeOf("function")
        expect(permissionless.InvalidEntryPointError).toBeTypeOf("function")
        for (const namespace of [
            EtherspotSmartAccount,
            KernelSmartAccount,
            LightSmartAccount,
            NexusSmartAccount,
            SafeSmartAccount,
            SimpleSmartAccount,
            ThirdwebSmartAccount,
            TrustSmartAccount
        ]) {
            expect(namespace).toBeTypeOf("object")
        }
        expect(SmartAccountClient.create).toBeTypeOf("function")
        expect(smartAccountActions).toBeTypeOf("function")
        expect(erc7579Actions).toBeTypeOf("function")
        expect(keys(Erc7579)).toEqual([
            "accountId",
            "decodeCalls",
            "encodeCalls",
            "encodeInstallModule",
            "encodeUninstallModule",
            "installModule",
            "installModules",
            "isModuleInstalled",
            "supportsExecutionMode",
            "supportsModule",
            "uninstallModule",
            "uninstallModules"
        ])
        expect(keys(Nonce)).toEqual(["decode", "encode"])
        expect(keys(Owner)).toEqual(["from"])
    })

    test("pimlico exports", () => {
        expect(keys(pimlico)).toEqual([
            "Erc20Paymaster",
            "PasskeyServer",
            "PasskeyServerClient",
            "Pimlico",
            "PimlicoClient",
            "pimlicoActions"
        ])
        expect(PimlicoClient.create).toBeTypeOf("function")
        expect(PasskeyServerClient.create).toBeTypeOf("function")
        expect(pimlicoActions).toBeTypeOf("function")
        expect(keys(Pimlico)).toEqual([
            "getUserOperationGasPrice",
            "getUserOperationStatus",
            "sponsorUserOperation",
            "validateSponsorshipPolicies"
        ])
        expect(keys(PasskeyServer)).toEqual([
            "getCredentials",
            "startAuthentication",
            "startRegistration",
            "verifyAuthentication",
            "verifyRegistration"
        ])
        expect(keys(Erc20Paymaster)).toEqual([
            "allowanceOverride",
            "balanceOverride",
            "estimateCost",
            "getTokenQuotes",
            "prepareUserOperation"
        ])
    })

    test("etherspot exports", () => {
        expect(keys(etherspot)).toEqual(["Etherspot"])
        expect(keys(Etherspot)).toEqual(["getUserOperationGasPrice"])
    })

    test("experimental is empty", () => {
        expect(keys(experimental)).toEqual([])
    })

    test("no namespace collides with viem/erc4337", () => {
        const viemExports = new Set(Object.keys(erc4337))
        expect(namespaces.filter((name) => viemExports.has(name))).toEqual([])
    })

    test("types", () => {
        expectTypeOf<SmartAccountClient.Client>().not.toBeAny()
        expectTypeOf<SmartAccountClient.Config>().not.toBeAny()
        expectTypeOf<SmartAccountClient.Actions>().not.toBeAny()
        expectTypeOf<SmartAccountClient.PrepareUserOperationHook>().not.toBeAny()
        expectTypeOf<permissionless.GetAccountNonceParams>().not.toBeAny()
        expectTypeOf<permissionless.GetSenderAddressParams>().not.toBeAny()
        expectTypeOf<permissionless.GetRequiredPrefundReturnType>().not.toBeAny()

        expectTypeOf<Erc7579.Actions<SmartAccount.SmartAccount>>().not.toBeAny()
        expectTypeOf<Erc7579.CallType>().toEqualTypeOf<
            "call" | "delegatecall" | "batchcall"
        >()
        expectTypeOf<Erc7579.ModuleType>().toEqualTypeOf<
            "validator" | "executor" | "fallback" | "hook"
        >()
        expectTypeOf<Erc7579.ExecutionMode<"call">>().not.toBeAny()
        expectTypeOf<Erc7579.EncodeCallsParameters<"call">>().not.toBeAny()
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

        expectTypeOf(Nonce.encode).returns.toEqualTypeOf<bigint>()
        expectTypeOf(Nonce.decode).returns.toEqualTypeOf<{
            key: bigint
            sequence: bigint
        }>()
        expectTypeOf(Owner.from).returns.resolves.toHaveProperty("address")

        expectTypeOf<PimlicoClient.Client>().not.toBeAny()
        expectTypeOf<PimlicoClient.Config>().not.toBeAny()
        expectTypeOf<PimlicoClient.Schema>().not.toBeAny()
        expectTypeOf<PasskeyServerClient.Client>().not.toBeAny()
        expectTypeOf<PasskeyServerClient.Config>().not.toBeAny()
        expectTypeOf<PasskeyServerClient.Schema>().not.toBeAny()

        expectTypeOf<Pimlico.Actions<Chain.Chain | undefined>>().not.toBeAny()
        expectTypeOf<Pimlico.GetUserOperationGasPriceReturnType>().not.toBeAny()
        expectTypeOf<Pimlico.GetUserOperationStatusParameters>().not.toBeAny()
        expectTypeOf<Pimlico.GetUserOperationStatusReturnType>().not.toBeAny()
        expectTypeOf<
            Pimlico.SponsorUserOperationParameters<"0.7">
        >().not.toBeAny()
        expectTypeOf<Pimlico.SponsorUserOperationReturnType>().not.toBeAny()
        expectTypeOf<Pimlico.ValidateSponsorshipPolicies>().not.toBeAny()
        expectTypeOf<Pimlico.ValidateSponsorshipPoliciesParameters>().not.toBeAny()

        expectTypeOf<PasskeyServer.Actions>().not.toBeAny()
        expectTypeOf<PasskeyServer.GetCredentialsParameters>().not.toBeAny()
        expectTypeOf<PasskeyServer.GetCredentialsReturnType>().not.toBeAny()
        expectTypeOf<PasskeyServer.StartRegistrationParameters>().not.toBeAny()
        expectTypeOf<PasskeyServer.StartRegistrationReturnType>().not.toBeAny()
        expectTypeOf<PasskeyServer.VerifyRegistrationParameters>().not.toBeAny()
        expectTypeOf<PasskeyServer.VerifyRegistrationReturnType>().not.toBeAny()
        expectTypeOf<PasskeyServer.StartAuthenticationReturnType>().not.toBeAny()
        expectTypeOf<PasskeyServer.VerifyAuthenticationParameters>().not.toBeAny()
        expectTypeOf<PasskeyServer.VerifyAuthenticationReturnType>().not.toBeAny()

        expectTypeOf<Erc20Paymaster.AllowanceOverrideParameters>().not.toBeAny()
        expectTypeOf<Erc20Paymaster.BalanceOverrideParameters>().not.toBeAny()
        expectTypeOf<
            Erc20Paymaster.EstimateCostParameters<"0.7", Chain.Chain>
        >().not.toBeAny()
        expectTypeOf<Erc20Paymaster.EstimateCostReturnType>().not.toBeAny()
        expectTypeOf<
            Erc20Paymaster.GetTokenQuotesParameters<Chain.Chain>
        >().not.toBeAny()
        expectTypeOf<Erc20Paymaster.GetTokenQuotesReturnType>().not.toBeAny()
        expectTypeOf<Erc20Paymaster.PrepareUserOperationParameters>().not.toBeAny()

        expectTypeOf<Etherspot.GetUserOperationGasPriceReturnType>().toEqualTypeOf<{
            maxFeePerGas: bigint
            maxPriorityFeePerGas: bigint
        }>()
        expectTypeOf<Etherspot.Schema>().not.toBeAny()

        expectTypeOf<
            SmartAccountClient.Client<
                Transport.Transport,
                Chain.Chain,
                SmartAccount.SmartAccount
            >
        >().toMatchTypeOf<SmartAccountClient.Client>()
        expectTypeOf<
            PimlicoClient.Client<EntryPoint.Version, Transport.Transport>
        >().toMatchTypeOf<PimlicoClient.Client>()
    })
})
