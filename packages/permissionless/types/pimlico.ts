import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { EntryPoint, GetEntryPointVersion } from "./entrypoint"
import type { UserOperationWithBigIntAsHex } from "./userOperation"

type PimlicoUserOperationGasPriceWithBigIntAsHex = {
    slow: {
        maxFeePerGas: Hex
        maxPriorityFeePerGas: Hex
    }
    standard: {
        maxFeePerGas: Hex
        maxPriorityFeePerGas: Hex
    }
    fast: {
        maxFeePerGas: Hex
        maxPriorityFeePerGas: Hex
    }
}

export type PimlicoUserOperationStatus = {
    status:
        | "not_found"
        | "not_submitted"
        | "submitted"
        | "rejected"
        | "reverted"
        | "included"
        | "failed"
    transactionHash: Hash | null
}

export type PimlicoBundlerRpcSchema = [
    {
        Method: "pimlico_getUserOperationGasPrice"
        Parameters: []
        ReturnType: PimlicoUserOperationGasPriceWithBigIntAsHex
    },
    {
        Method: "pimlico_getUserOperationStatus"
        Parameters: [hash: Hash]
        ReturnType: PimlicoUserOperationStatus
    },
    {
        Method: "pimlico_sendCompressedUserOperation"
        Parameters: [
            compressedUserOperation: Hex,
            inflatorAddress: Address,
            entryPoint: Address
        ]
        ReturnType: Hash
    }
]

export type PimlicoPaymasterRpcSchema<entryPoint extends EntryPoint> = [
    {
        Method: "pm_sponsorUserOperation"
        Parameters: [
            userOperation: GetEntryPointVersion<entryPoint> extends "v0.6"
                ? PartialBy<
                      UserOperationWithBigIntAsHex<"v0.6">,
                      | "callGasLimit"
                      | "preVerificationGas"
                      | "verificationGasLimit"
                  >
                : PartialBy<
                      UserOperationWithBigIntAsHex<"v0.7">,
                      | "callGasLimit"
                      | "preVerificationGas"
                      | "verificationGasLimit"
                      | "paymasterVerificationGasLimit"
                      | "paymasterPostOpGasLimit"
                  >,
            entryPoint: entryPoint,
            metadata?: {
                sponsorshipPolicyId?: string
            }
        ]
        ReturnType: GetEntryPointVersion<entryPoint> extends "v0.6"
            ? {
                  paymasterAndData: Hex
                  preVerificationGas: Hex
                  verificationGasLimit: Hex
                  callGasLimit: Hex
                  paymaster?: never
                  paymasterVerificationGasLimit?: never
                  paymasterPostOpGasLimit?: never
                  paymasterData?: never
              }
            : {
                  preVerificationGas: Hex
                  verificationGasLimit: Hex
                  callGasLimit: Hex
                  paymaster: Address
                  paymasterVerificationGasLimit: Hex
                  paymasterPostOpGasLimit: Hex
                  paymasterData: Hex
                  paymasterAndData?: never
              }
    },
    {
        Method: "pm_validateSponsorshipPolicies"
        Parameters: [
            userOperation: UserOperationWithBigIntAsHex<
                GetEntryPointVersion<entryPoint>
            >,
            entryPoint: entryPoint,
            sponsorshipPolicyIds: string[]
        ]
        ReturnType: {
            sponsorshipPolicyId: string
            data: {
                name: string | null
                author: string | null
                icon: string | null
                description: string | null
            }
        }[]
    }
]
