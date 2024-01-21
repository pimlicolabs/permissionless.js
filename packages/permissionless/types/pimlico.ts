import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { UserOperationWithBigIntAsHex } from "./userOperation.js"

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

export type PimlicoPaymasterRpcSchema = [
    {
        Method: "pm_sponsorUserOperation"
        Parameters: [
            userOperation: PartialBy<
                UserOperationWithBigIntAsHex,
                | "callGasLimit"
                | "preVerificationGas"
                | "verificationGasLimit"
                | "paymasterAndData"
            >,
            entryPoint: Address,
            metadata?: {
                sponsorshipPolicyId?: string
            }
        ]
        ReturnType: {
            paymasterAndData: Hex
            preVerificationGas: Hex
            verificationGasLimit: Hex
            callGasLimit: Hex
        }
    },
    {
        Method: "pm_validateSponsorshipPolicies"
        Parameters: [
            userOperation: UserOperationWithBigIntAsHex,
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
    }
]
