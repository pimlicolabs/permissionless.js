import type { Address, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { UserOperationWithBigIntAsHex } from "./userOperation"

interface StackupPaymasterContextType {
    type: "erc20token" | "payg"
}

export type StackupPaymasterContext =
    | (StackupPaymasterContextType & { type: "erc20token"; token: string })
    | (StackupPaymasterContextType & { type: "payg" })

export type StackupPaymasterRpcSchema = [
    {
        Method: "pm_sponsorUserOperation"
        Parameters: [
            userOperation: PartialBy<
                UserOperationWithBigIntAsHex,
                "callGasLimit" | "preVerificationGas" | "verificationGasLimit" | "paymasterAndData"
            >,
            entryPoint: Address,
            context: StackupPaymasterContext
        ]
        ReturnType: {
            paymasterAndData: Hex
            preVerificationGas: Hex
            verificationGasLimit: Hex
            callGasLimit: Hex
        }
    },
    {
        Method: "pm_accounts"
        Parameters: [entryPoint: Address]
        ReturnType: Address[]
    }
]
