import type { Address, Hash, Hex } from "viem"
import type { UserOperation } from "./userOperation.js"

export type BasePaymasterRpcSchema = [
    {
        Method: "eth_paymasterAndDataForEstimateGas"
        Parameters: [
            userOperation: UserOperation,
            entryPoint: Address,
            chainId: Hex
        ]
        ReturnType: Hash
    },
    {
        Method: "eth_paymasterAndDataForUserOperation"
        Parameters: [
            userOperation: UserOperation,
            entryPoint: Address,
            chainId: Hex
        ]
        ReturnType: Hash
    }
]
