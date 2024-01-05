import type { Address, Hash, Hex } from "viem"
import type { UserOperationWithBigIntAsHex } from "./userOperation.js"

export type BasePaymasterRpcSchema = [
    {
        Method: "eth_paymasterAndDataForEstimateGas"
        Parameters: [
            userOperation: UserOperationWithBigIntAsHex,
            entryPoint: Address,
            chainId: Hex
        ]
        ReturnType: Hash
    },
    {
        Method: "eth_paymasterAndDataForUserOperation"
        Parameters: [
            userOperation: UserOperationWithBigIntAsHex,
            entryPoint: Address,
            chainId: Hex
        ]
        ReturnType: Hash
    }
]
