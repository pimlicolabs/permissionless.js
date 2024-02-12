import type { Address, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { UserOperationWithBigIntAsHex } from "./userOperation"
import type { EntryPoint, GetEntryPointVersion } from "./entrypoint"

interface StackupPaymasterContextType {
    type: "erc20token" | "payg"
}

export type StackupPaymasterContext =
    | (StackupPaymasterContextType & { type: "erc20token"; token: string })
    | (StackupPaymasterContextType & { type: "payg" })

export type StackupPaymasterRpcSchema<entryPoint extends EntryPoint> = [
    {
        Method: "pm_sponsorUserOperation"
        Parameters: [
            userOperation: GetEntryPointVersion<entryPoint> extends "0.6"
                ? PartialBy<
                      UserOperationWithBigIntAsHex<"0.6">,
                      | "callGasLimit"
                      | "preVerificationGas"
                      | "verificationGasLimit"
                  >
                : PartialBy<
                      UserOperationWithBigIntAsHex<"0.7">,
                      | "callGasLimit"
                      | "preVerificationGas"
                      | "verificationGasLimit"
                      | "paymasterVerificationGasLimit"
                      | "paymasterPostOpGasLimit"
                  >,
            entryPoint: entryPoint,
            context: StackupPaymasterContext
        ]
        ReturnType: GetEntryPointVersion<entryPoint> extends "0.6"
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
        Method: "pm_accounts"
        Parameters: [entryPoint: Address]
        ReturnType: Address[]
    }
]
