import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { EntryPoint, GetEntryPointVersion } from "./entrypoint"
import type { UserOperationWithBigIntAsHex } from "./userOperation"

export type BundlerRpcSchema<entryPoint extends EntryPoint> = [
    {
        Method: "eth_sendUserOperation"
        Parameters: [
            userOperation: UserOperationWithBigIntAsHex<
                GetEntryPointVersion<entryPoint>
            >,
            entryPoint: entryPoint
        ]
        ReturnType: Hash
    },
    {
        Method: "eth_estimateUserOperationGas"
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
            stateOverrides?: StateOverrides
        ]
        ReturnType: GetEntryPointVersion<entryPoint> extends "v0.6"
            ? {
                  preVerificationGas: Hex
                  verificationGasLimit: Hex
                  callGasLimit: Hex
              }
            : {
                  preVerificationGas: Hex
                  verificationGasLimit: Hex
                  callGasLimit?: Hex | null
                  paymasterVerificationGasLimit?: Hex | null
                  paymasterPostOpGasLimit?: Hex | null
              }
    },
    {
        Method: "eth_supportedEntryPoints"
        Parameters: []
        ReturnType: Address[]
    },
    {
        Method: "eth_chainId"
        Parameters: []
        ReturnType: Hex
    },
    {
        Method: "eth_getUserOperationByHash"
        Parameters: [hash: Hash]
        ReturnType: {
            userOperation: UserOperationWithBigIntAsHex<
                GetEntryPointVersion<entryPoint>
            >
            entryPoint: entryPoint
            transactionHash: Hash
            blockHash: Hash
            blockNumber: Hex
        }
    },
    {
        Method: "eth_getUserOperationReceipt"
        Parameters: [hash: Hash]
        ReturnType: UserOperationReceiptWithBigIntAsHex
    }
]

type UserOperationReceiptWithBigIntAsHex = {
    userOpHash: Hash
    entryPoint: Address
    sender: Address
    nonce: Hex
    paymaster?: Address
    actualGasUsed: Hex
    actualGasCost: Hex
    success: boolean
    reason?: string
    receipt: {
        transactionHash: Hex
        transactionIndex: Hex
        blockHash: Hash
        blockNumber: Hex
        from: Address
        to: Address | null
        cumulativeGasUsed: Hex
        status: "0x0" | "0x1"
        gasUsed: Hex
        contractAddress: Address | null
        logsBloom: Hex
        effectiveGasPrice: Hex
    }
    logs: {
        data: Hex
        blockNumber: Hex
        blockHash: Hash
        transactionHash: Hash
        logIndex: Hex
        transactionIndex: Hex
        address: Address
        topics: [Hex, ...Hex[]] | []
        removed: boolean
    }[]
}

export type StateOverrides = {
    [x: string]: {
        balance?: bigint | undefined
        nonce?: bigint | number | undefined
        code?: Hex | undefined
        state?: {
            [x: Hex]: Hex
        }
        stateDiff?: {
            [x: Hex]: Hex
        }
    }
}
