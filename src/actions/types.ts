import type { Address } from "abitype"
import type { Hash, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"

export type BundlerRpcSchema = [
    {
        Method: "eth_sendUserOperation"
        Parameters: [userOperation: UserOperationWithBigIntAsHex, entryPoint: Address]
        ReturnType: Hash
    },
    {
        Method: "eth_estimateUserOperationGas"
        Parameters: [
            userOperation: PartialBy<
                UserOperationWithBigIntAsHex,
                "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
            >,
            entryPoint: Address
        ]
        ReturnType: {
            preVerificationGas: Hex
            verificationGasLimit: Hex
            callGasLimit: Hex
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
            userOperation: UserOperationWithBigIntAsHex
            entryPoint: Address
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

export type UserOperationWithBigIntAsHex = {
    sender: Address
    nonce: Hex
    initCode: Hex
    callData: Hex
    callGasLimit: Hex
    verificationGasLimit: Hex
    preVerificationGas: Hex
    maxFeePerGas: Hex
    maxPriorityFeePerGas: Hex
    paymasterAndData: Hex
    signature: Hex
}

export type UserOperation = {
    sender: Address
    nonce: bigint
    initCode: Hex
    callData: Hex
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
    paymasterAndData: Hex
    signature: Hex
}

export type UserOperationReceipt = {
    userOpHash: Hash
    sender: Address
    nonce: bigint
    actualGasUsed: bigint
    actualGasCost: bigint
    success: boolean
    receipt: {
        transactionHash: Hex
        transactionIndex: bigint
        blockHash: Hash
        blockNumber: bigint
        from: Address
        to: Address | null
        cumulativeGasUsed: bigint
        status: bigint | null
        gasUsed: bigint
        contractAddress: Address | null
        logsBloom: string
        effectiveGasPrice: bigint
    }
    logs: {
        data: Hex
        blockNumber: bigint
        blockHash: Hash
        transactionHash: Hash
        logIndex: bigint
        transactionIndex: bigint
        address: Address
        topics: Hex[]
    }[]
}

type UserOperationReceiptWithBigIntAsHex = {
    userOpHash: Hash
    sender: Address
    nonce: Hex
    actualGasUsed: Hex
    actualGasCost: Hex
    success: boolean
    receipt: {
        transactionHash: Hex
        transactionIndex: Hex
        blockHash: Hash
        blockNumber: Hex
        from: Address
        to: Address | null
        cumulativeGasUsed: Hex
        status: Hex | null
        gasUsed: Hex
        contractAddress: Address | null
        logsBloom: string
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
        topics: Hex[]
    }[]
}
