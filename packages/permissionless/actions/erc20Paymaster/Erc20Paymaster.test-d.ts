import { type SafeSmartAccount, SmartAccountClient } from "permissionless"
import { Erc20Paymaster, PimlicoClient } from "permissionless/pimlico"
import { type Chain, http } from "viem"
import { sepolia } from "viem/chains"
import { EntryPoint, type UserOperation } from "viem/erc4337"
import type { Address, StateOverrides } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const safeAccount: SafeSmartAccount.ReturnType
declare const address: Address.Address
declare const userOperation07: UserOperation.UserOperation<"0.7">

const pimlicoClient = PimlicoClient.create({
    chain: sepolia,
    transport: http("https://bundler.invalid")
})
const chainless = PimlicoClient.create({
    transport: http("https://bundler.invalid")
})

describe("Erc20Paymaster", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof Erc20Paymaster>().toEqualTypeOf<
            | "allowanceOverride"
            | "balanceOverride"
            | "estimateCost"
            | "getTokenQuotes"
            | "prepareUserOperation"
        >()
        expectTypeOf<Erc20Paymaster.AllowanceOverrideParameters>().toEqualTypeOf<{
            token: Address.Address
            owner: Address.Address
            spender: Address.Address
            slot: bigint
            amount?: bigint
        }>()
        expectTypeOf<Erc20Paymaster.BalanceOverrideParameters>().toEqualTypeOf<{
            token: Address.Address
            owner: Address.Address
            slot: bigint
            balance?: bigint
        }>()
        expectTypeOf<
            Erc20Paymaster.EstimateCostParameters<"0.7", Chain.Chain>
        >().not.toBeAny()
        expectTypeOf<Erc20Paymaster.EstimateCostReturnType>().toEqualTypeOf<{
            costInToken: bigint
            costInUsd: bigint
        }>()
        expectTypeOf<
            Erc20Paymaster.GetTokenQuotesParameters<Chain.Chain>
        >().not.toBeAny()
        expectTypeOf<Erc20Paymaster.GetTokenQuotesReturnType>().toEqualTypeOf<
            {
                paymaster: Address.Address
                token: Address.Address
                postOpGas: bigint
                exchangeRate: bigint
                exchangeRateNativeToUsd: bigint
                balanceSlot?: bigint
                allowanceSlot?: bigint
            }[]
        >()
        expectTypeOf<Erc20Paymaster.PrepareUserOperationParameters>().toEqualTypeOf<{
            balanceOverride?: boolean
            balanceSlot?: bigint
        }>()
    })

    test("state overrides", () => {
        expectTypeOf(Erc20Paymaster.balanceOverride).toBeCallableWith({
            token: address,
            owner: address,
            slot: 0n
        })
        expectTypeOf(
            Erc20Paymaster.balanceOverride
        ).returns.toEqualTypeOf<StateOverrides.StateOverrides>()
        expectTypeOf(Erc20Paymaster.allowanceOverride).toBeCallableWith({
            token: address,
            owner: address,
            spender: address,
            slot: 0n,
            amount: 1n
        })
        expectTypeOf(
            Erc20Paymaster.allowanceOverride
        ).returns.toEqualTypeOf<StateOverrides.StateOverrides>()
    })

    test("quotes and cost need a chain from the client or the call", () => {
        Erc20Paymaster.getTokenQuotes(pimlicoClient, {
            tokens: [address],
            entryPointAddress: EntryPoint.addressV07
        })
        Erc20Paymaster.getTokenQuotes(chainless, {
            tokens: [address],
            entryPointAddress: EntryPoint.addressV07,
            chain: sepolia
        })
        // @ts-expect-error a chain-less client must pass one
        Erc20Paymaster.getTokenQuotes(chainless, {
            tokens: [address],
            entryPointAddress: address
        })
        expectTypeOf(
            Erc20Paymaster.getTokenQuotes
        ).returns.resolves.toEqualTypeOf<Erc20Paymaster.GetTokenQuotesReturnType>()
        Erc20Paymaster.estimateCost(pimlicoClient, {
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
            userOperation: userOperation07,
            token: address
        })
        expectTypeOf(
            Erc20Paymaster.estimateCost
        ).returns.resolves.toEqualTypeOf<Erc20Paymaster.EstimateCostReturnType>()
        pimlicoClient.getTokenQuotes({ tokens: [address] })
        pimlicoClient.estimateErc20PaymasterCost({
            userOperation: userOperation07,
            token: address
        })
    })

    test("prepareUserOperation is a SmartAccountClient hook without a cast", () => {
        const hook = Erc20Paymaster.prepareUserOperation(pimlicoClient)
        expectTypeOf(
            hook
        ).toEqualTypeOf<SmartAccountClient.PrepareUserOperationHook>()
        expectTypeOf(
            Erc20Paymaster.prepareUserOperation(pimlicoClient, {
                balanceOverride: true,
                balanceSlot: 9n
            })
        ).toEqualTypeOf<SmartAccountClient.PrepareUserOperationHook>()
        expectTypeOf(SmartAccountClient.create).toBeCallableWith({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport: http("https://bundler.invalid"),
            paymaster: pimlicoClient,
            userOperation: { prepareUserOperation: hook }
        })
    })
})
