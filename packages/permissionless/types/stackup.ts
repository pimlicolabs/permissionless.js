import type { Address, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { ENTRYPOINT_ADDRESS_0_6_TYPE, EntryPoint } from "./entrypoint"
import type { UserOperationWithBigIntAsHex } from "./userOperation"

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
            userOperation: entryPoint extends ENTRYPOINT_ADDRESS_0_6_TYPE
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
        ReturnType: entryPoint extends ENTRYPOINT_ADDRESS_0_6_TYPE
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
