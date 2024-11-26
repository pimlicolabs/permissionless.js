import type { Address, Hash, Hex, OneOf, PartialBy } from "viem"
import type { UserOperation } from "viem/account-abstraction"

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

type GetTokenQuotesWithBigIntAsHex = {
    quotes: {
        paymaster: Address
        token: Address
        postOpGas: Hex
        exchangeRate: Hex
        exchangeRateNativeToUsd: Hex
        balanceSlot?: Hex
        allowanceSlot?: Hex
    }[]
}

export type PimlicoRpcSchema<
    entryPointVersion extends "0.6" | "0.7" = "0.6" | "0.7"
> = [
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
    },
    {
        Method: "pm_sponsorUserOperation"
        Parameters: [
            userOperation: OneOf<
                | (entryPointVersion extends "0.6"
                      ? PartialBy<
                            UserOperation<"0.6", Hex>,
                            | "callGasLimit"
                            | "preVerificationGas"
                            | "verificationGasLimit"
                        >
                      : never)
                | (entryPointVersion extends "0.7"
                      ? PartialBy<
                            UserOperation<"0.7", Hex>,
                            | "callGasLimit"
                            | "preVerificationGas"
                            | "verificationGasLimit"
                            | "paymasterVerificationGasLimit"
                            | "paymasterPostOpGasLimit"
                        >
                      : never)
            >,
            entryPoint: Address,
            metadata?: {
                sponsorshipPolicyId?: string
            }
        ]
        ReturnType: entryPointVersion extends "0.6"
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
            userOperation: UserOperation<entryPointVersion, Hex>,
            entryPoint: Address,
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
    },
    {
        Method: "pimlico_getTokenQuotes"
        Parameters: [
            tokens: { tokens: Address[] },
            entryPoint: Address,
            chainId: Hex
        ]
        ReturnType: GetTokenQuotesWithBigIntAsHex
    }
]
