import type { EntryPoint, UserOperation } from "viem/erc4337"
import type { Address, Hex, RpcSchema } from "viem/utils"
import type { OneOf, PartialBy } from "./utils.js"

type PimlicoUserOperationGasPriceWithBigIntAsHex = {
    slow: {
        maxFeePerGas: Hex.Hex
        maxPriorityFeePerGas: Hex.Hex
    }
    standard: {
        maxFeePerGas: Hex.Hex
        maxPriorityFeePerGas: Hex.Hex
    }
    fast: {
        maxFeePerGas: Hex.Hex
        maxPriorityFeePerGas: Hex.Hex
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
    transactionHash: Hex.Hex | null
}

type GetTokenQuotesWithBigIntAsHex = {
    quotes: {
        paymaster: Address.Address
        token: Address.Address
        postOpGas: Hex.Hex
        exchangeRate: Hex.Hex
        exchangeRateNativeToUsd: Hex.Hex
        balanceSlot?: Hex.Hex
        allowanceSlot?: Hex.Hex
    }[]
}

type SponsorUserOperationRpcParameter<
    entryPointVersion extends EntryPoint.Version
> = OneOf<
    | (entryPointVersion extends "0.6"
          ? PartialBy<
                UserOperation.UserOperation<"0.6", boolean, Hex.Hex>,
                "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
            >
          : never)
    | (entryPointVersion extends "0.7"
          ? PartialBy<
                UserOperation.UserOperation<"0.7", boolean, Hex.Hex>,
                | "callGasLimit"
                | "preVerificationGas"
                | "verificationGasLimit"
                | "paymasterVerificationGasLimit"
                | "paymasterPostOpGasLimit"
            >
          : never)
    | (entryPointVersion extends "0.8"
          ? PartialBy<
                UserOperation.UserOperation<"0.8", boolean, Hex.Hex, Hex.Hex>,
                | "callGasLimit"
                | "preVerificationGas"
                | "verificationGasLimit"
                | "paymasterVerificationGasLimit"
                | "paymasterPostOpGasLimit"
            >
          : never)
    | (entryPointVersion extends "0.9"
          ? PartialBy<
                UserOperation.UserOperation<"0.9", boolean, Hex.Hex, Hex.Hex>,
                | "callGasLimit"
                | "preVerificationGas"
                | "verificationGasLimit"
                | "paymasterVerificationGasLimit"
                | "paymasterPostOpGasLimit"
            >
          : never)
>

type SponsorUserOperationRpcReturnType<
    entryPointVersion extends EntryPoint.Version
> = entryPointVersion extends "0.6"
    ? {
          paymasterAndData: Hex.Hex
          preVerificationGas: Hex.Hex
          verificationGasLimit: Hex.Hex
          callGasLimit: Hex.Hex
          paymaster?: never
          paymasterVerificationGasLimit?: never
          paymasterPostOpGasLimit?: never
          paymasterData?: never
      }
    : {
          preVerificationGas: Hex.Hex
          verificationGasLimit: Hex.Hex
          callGasLimit: Hex.Hex
          paymaster: Address.Address
          paymasterVerificationGasLimit: Hex.Hex
          paymasterPostOpGasLimit: Hex.Hex
          paymasterData: Hex.Hex
          paymasterAndData?: never
      }

export type PimlicoRpcSchema<
    entryPointVersion extends EntryPoint.Version = EntryPoint.Version
> = RpcSchema.From<
    | {
          Request: {
              method: "pimlico_getUserOperationGasPrice"
              params?: undefined
          }
          ReturnType: PimlicoUserOperationGasPriceWithBigIntAsHex
      }
    | {
          Request: {
              method: "pimlico_getUserOperationStatus"
              params: [hash: Hex.Hex]
          }
          ReturnType: PimlicoUserOperationStatus
      }
    | {
          Request: {
              method: "pm_sponsorUserOperation"
              params: [
                  userOperation: SponsorUserOperationRpcParameter<entryPointVersion>,
                  entryPoint: Address.Address,
                  metadata?: {
                      sponsorshipPolicyId?: string
                  }
              ]
          }
          ReturnType: SponsorUserOperationRpcReturnType<entryPointVersion>
      }
    | {
          Request: {
              method: "pm_validateSponsorshipPolicies"
              params: [
                  userOperation: UserOperation.UserOperation<
                      entryPointVersion,
                      boolean,
                      Hex.Hex,
                      Hex.Hex
                  >,
                  entryPoint: Address.Address,
                  sponsorshipPolicyIds: string[]
              ]
          }
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
    | {
          Request: {
              method: "pimlico_getTokenQuotes"
              params: [
                  tokens: { tokens: Address.Address[] },
                  entryPoint: Address.Address,
                  chainId: Hex.Hex
              ]
          }
          ReturnType: GetTokenQuotesWithBigIntAsHex
      }
>
