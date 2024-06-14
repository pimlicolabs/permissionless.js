import type { Address, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { EntryPoint, GetEntryPointVersion } from "./entrypoint"
import type { UserOperationWithBigIntAsHex } from "./userOperation"

type GetGasPriceResponse = {
    maxFeePerGas: string
    maxPriorityFeePerGas: string
}

export type EtherspotBundlerRpcSchema = [
    {
        Method: "skandha_getGasPrice"
        Parameters: []
        ReturnType: GetGasPriceResponse
    }
]

interface ArkaPaymasterContextType {
    type: "sponsor" | "erc20" | "multitoken"
}

export type ArkaPaymasterContext =
    | (ArkaPaymasterContextType & { type: "erc20"; token: string })
    | (ArkaPaymasterContextType & { type: "multitoken"; token: string })
    | (ArkaPaymasterContextType & {
          type: "sponsor"
          validUntil: number
          validAfter: number
      })
    | (ArkaPaymasterContextType & { type: "sponsor" })

export type ArkaPaymasterRpcSchema<entryPoint extends EntryPoint> = [
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
            context: ArkaPaymasterContext
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
    }
]
