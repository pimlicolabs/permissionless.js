import { Pimlico, PimlicoClient } from "permissionless/pimlico"
import { http } from "viem"
import { EntryPoint, type UserOperation } from "viem/erc4337"
import type { Address, Hex } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const address: Address.Address
declare const hash: Hex.Hex
declare const userOperation06: UserOperation.UserOperation<"0.6">
declare const userOperation07: UserOperation.UserOperation<"0.7">
declare const userOperation08: UserOperation.UserOperation<"0.8">
declare const userOperation09: UserOperation.UserOperation<"0.9">

const client = PimlicoClient.create({
    transport: http("https://bundler.invalid")
})

describe("Pimlico", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof Pimlico>().toEqualTypeOf<
            | "getUserOperationGasPrice"
            | "getUserOperationStatus"
            | "sponsorUserOperation"
            | "validateSponsorshipPolicies"
        >()
        expectTypeOf<Pimlico.Actions<undefined>>().not.toBeAny()
        expectTypeOf<Pimlico.GetUserOperationGasPriceReturnType>().toEqualTypeOf<{
            slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
            standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
            fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
        }>()
        expectTypeOf<Pimlico.GetUserOperationStatusParameters>().toEqualTypeOf<{
            hash: Hex.Hex
        }>()
        expectTypeOf<Pimlico.GetUserOperationStatusReturnType>().toEqualTypeOf<{
            status:
                | "not_found"
                | "not_submitted"
                | "submitted"
                | "rejected"
                | "reverted"
                | "included"
                | "failed"
            transactionHash: Hex.Hex | null
        }>()
        expectTypeOf<
            Pimlico.SponsorUserOperationParameters<"0.7">
        >().not.toBeAny()
        expectTypeOf<Pimlico.SponsorUserOperationReturnType>().not.toBeAny()
        expectTypeOf<Pimlico.ValidateSponsorshipPolicies>().toEqualTypeOf<{
            sponsorshipPolicyId: string
            data: {
                name: string | null
                author: string | null
                icon: string | null
                description: string | null
            }
        }>()
        expectTypeOf<Pimlico.ValidateSponsorshipPoliciesParameters>().toEqualTypeOf<{
            userOperation: UserOperation.UserOperation
            entryPointAddress: Address.Address
            sponsorshipPolicyIds: string[]
        }>()
    })

    test("actions take a client with request", () => {
        expectTypeOf(Pimlico.getUserOperationGasPrice).toBeCallableWith(client)
        expectTypeOf(
            Pimlico.getUserOperationGasPrice
        ).returns.resolves.toEqualTypeOf<Pimlico.GetUserOperationGasPriceReturnType>()
        expectTypeOf(Pimlico.getUserOperationStatus).toBeCallableWith(client, {
            hash
        })
        expectTypeOf(
            Pimlico.getUserOperationStatus
        ).returns.resolves.toEqualTypeOf<Pimlico.GetUserOperationStatusReturnType>()
        expectTypeOf(Pimlico.validateSponsorshipPolicies).toBeCallableWith(
            client,
            {
                userOperation: userOperation07,
                entryPointAddress: EntryPoint.addressV07,
                sponsorshipPolicyIds: ["sp_x"]
            }
        )
        expectTypeOf(
            Pimlico.validateSponsorshipPolicies
        ).returns.resolves.toEqualTypeOf<
            Pimlico.ValidateSponsorshipPolicies[]
        >()
    })

    test("sponsorUserOperation type-checks on every EntryPoint version", () => {
        expectTypeOf(
            Pimlico.sponsorUserOperation(client, {
                userOperation: userOperation06,
                entryPoint: { address: EntryPoint.addressV06, version: "0.6" },
                sponsorshipPolicyId: "sp_x"
            })
        ).resolves.toEqualTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.6">
        >()
        expectTypeOf(
            Pimlico.sponsorUserOperation(client, {
                userOperation: userOperation07,
                entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
            })
        ).resolves.toEqualTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.7">
        >()
        expectTypeOf(
            Pimlico.sponsorUserOperation(client, {
                userOperation: userOperation08,
                entryPoint: { address: EntryPoint.addressV08, version: "0.8" },
                paymasterContext: { validForSeconds: 60 }
            })
        ).resolves.toEqualTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.8">
        >()
        expectTypeOf(
            Pimlico.sponsorUserOperation(client, {
                userOperation: userOperation09,
                entryPoint: { address: EntryPoint.addressV09, version: "0.9" }
            })
        ).resolves.toEqualTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.9">
        >()
        expectTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.6">
        >().toEqualTypeOf<{
            callGasLimit: bigint
            verificationGasLimit: bigint
            preVerificationGas: bigint
            paymasterAndData: Hex.Hex
        }>()
        expectTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.7">
        >().toEqualTypeOf<{
            callGasLimit: bigint
            verificationGasLimit: bigint
            preVerificationGas: bigint
            paymaster: Address.Address
            paymasterVerificationGasLimit: bigint
            paymasterPostOpGasLimit: bigint
            paymasterData: Hex.Hex
        }>()
        expectTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.8">
        >().toEqualTypeOf<Pimlico.SponsorUserOperationReturnType<"0.7">>()
        expectTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.9">
        >().toEqualTypeOf<Pimlico.SponsorUserOperationReturnType<"0.7">>()
        expectTypeOf<
            Pimlico.SponsorUserOperationReturnType<"0.7">
        >().toHaveProperty("paymasterData")
        expectTypeOf<
            Pimlico.SponsorUserOperationParameters<"0.8">["userOperation"]
        >().toHaveProperty("authorization")
        expectTypeOf<
            Pimlico.SponsorUserOperationParameters<"0.6">["userOperation"]["callGasLimit"]
        >().toEqualTypeOf<bigint | undefined>()
        Pimlico.sponsorUserOperation(client, {
            userOperation: userOperation07,
            // @ts-expect-error
            entryPoint: { address, version: "0.5" }
        })
    })

    test("PimlicoClient.Schema names the RPC methods", () => {
        expectTypeOf<PimlicoClient.Schema["Request"]["method"]>().toEqualTypeOf<
            | "pimlico_getUserOperationGasPrice"
            | "pimlico_getUserOperationStatus"
            | "pm_sponsorUserOperation"
            | "pm_validateSponsorshipPolicies"
            | "pimlico_getTokenQuotes"
        >()
    })
})
