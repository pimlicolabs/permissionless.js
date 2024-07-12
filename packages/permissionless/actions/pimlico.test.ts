import type {
    Account,
    Address,
    Chain,
    Client,
    Hash,
    Hex,
    Transport
} from "viem"
import { describe, expectTypeOf, test } from "vitest"
import type { EntryPoint } from "../types/entrypoint"
import type { PimlicoBundlerRpcSchema } from "../types/pimlico"
import type { UserOperation } from "../types/userOperation"
import {
    type PimlicoBundlerActions,
    getUserOperationGasPrice,
    getUserOperationStatus,
    pimlicoBundlerActions,
    sendCompressedUserOperation,
    sponsorUserOperation,
    validateSponsorshipPolicies
} from "./pimlico"

describe("pimlico", () => {
    test("getUserOperationGasPrice", () => {
        expectTypeOf(getUserOperationGasPrice).toBeFunction()
        expectTypeOf(getUserOperationGasPrice)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    PimlicoBundlerRpcSchema
                >
            >()
        expectTypeOf(getUserOperationGasPrice).returns.toMatchTypeOf<Promise<{
            slow: {
                maxFeePerGas: bigint
                maxPriorityFeePerGas: bigint
            }
            standard: {
                maxFeePerGas: bigint
                maxPriorityFeePerGas: bigint
            }
            fast: {
                maxFeePerGas: bigint
                maxPriorityFeePerGas: bigint
            }
        }> | null>()
    })

    test("getUserOperationStatus", () => {
        expectTypeOf(getUserOperationStatus).toBeFunction()
        expectTypeOf(getUserOperationStatus)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    PimlicoBundlerRpcSchema
                >
            >()
        expectTypeOf(getUserOperationStatus).parameter(1).toMatchTypeOf<{
            hash: string
        }>()
        expectTypeOf(getUserOperationStatus).returns.toMatchTypeOf<
            Promise<{
                status:
                    | "not_found"
                    | "not_submitted"
                    | "submitted"
                    | "rejected"
                    | "reverted"
                    | "included"
                    | "failed"
                transactionHash: Hash | null
            }>
        >()
    })

    test("sendCompressedUserOperation", () => {
        expectTypeOf(sendCompressedUserOperation).toBeFunction()
        expectTypeOf(sendCompressedUserOperation)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    PimlicoBundlerRpcSchema
                >
            >()
        expectTypeOf(sendCompressedUserOperation).parameter(1).toMatchTypeOf<{
            compressedUserOperation: Hex
            inflatorAddress: Address
            entryPoint: Address
        }>()
        expectTypeOf(sendCompressedUserOperation).returns.toMatchTypeOf<
            Promise<Hash>
        >()
    })

    test("sponsorUserOperation", () => {
        expectTypeOf(sponsorUserOperation).toBeFunction()
        expectTypeOf(sponsorUserOperation)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    PimlicoBundlerRpcSchema
                >
            >()
        expectTypeOf(sponsorUserOperation).parameter(1).toMatchTypeOf<{
            userOperation: UserOperation<"v0.6" | "v0.7">
            entryPoint: EntryPoint
            sponsorshipPolicyId?: string
        }>()
        expectTypeOf(sponsorUserOperation).returns.toMatchTypeOf<
            Promise<
                | {
                      callGasLimit: bigint
                      verificationGasLimit: bigint
                      preVerificationGas: bigint
                      paymasterAndData: Hex
                  }
                | {
                      callGasLimit: bigint
                      verificationGasLimit: bigint
                      preVerificationGas: bigint
                      paymaster: Address
                      paymasterVerificationGasLimit: bigint
                      paymasterPostOpGasLimit: bigint
                      paymasterData: Hex
                  }
            >
        >()
    })

    test("sponsorUserOperation", () => {
        expectTypeOf(sponsorUserOperation).toBeFunction()
        expectTypeOf(sponsorUserOperation)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    PimlicoBundlerRpcSchema
                >
            >()
        expectTypeOf(sponsorUserOperation).parameter(1).toMatchTypeOf<{
            userOperation: UserOperation<"v0.6" | "v0.7">
            entryPoint: EntryPoint
            sponsorshipPolicyId?: string
        }>()
        expectTypeOf(sponsorUserOperation).returns.toMatchTypeOf<
            Promise<
                | {
                      callGasLimit: bigint
                      verificationGasLimit: bigint
                      preVerificationGas: bigint
                      paymasterAndData: Hex
                  }
                | {
                      callGasLimit: bigint
                      verificationGasLimit: bigint
                      preVerificationGas: bigint
                      paymaster: Address
                      paymasterVerificationGasLimit: bigint
                      paymasterPostOpGasLimit: bigint
                      paymasterData: Hex
                  }
            >
        >()
    })

    test("validateSponsorshipPolicies", () => {
        expectTypeOf(validateSponsorshipPolicies).toBeFunction()
        expectTypeOf(validateSponsorshipPolicies)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    PimlicoBundlerRpcSchema
                >
            >()
        expectTypeOf(validateSponsorshipPolicies).parameter(1).toMatchTypeOf<{
            userOperation: UserOperation<"v0.6" | "v0.7">
            entryPoint: EntryPoint
            sponsorshipPolicyIds: string[]
        }>()
        expectTypeOf(validateSponsorshipPolicies).returns.toMatchTypeOf<
            Promise<
                {
                    sponsorshipPolicyId: string
                    data: {
                        name: string | null
                        author: string | null
                        icon: string | null
                        description: string | null
                    }
                }[]
            >
        >()
    })

    test("pimlicoBundlerActions", () => {
        expectTypeOf(pimlicoBundlerActions).toBeFunction()
        expectTypeOf(pimlicoBundlerActions)
            .parameter(0)
            .toMatchTypeOf<EntryPoint>()
        expectTypeOf(pimlicoBundlerActions).returns.toMatchTypeOf<
            (client: Client) => PimlicoBundlerActions
        >()
    })
})
