import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { UserOperationWithBigIntAsHex } from "./userOperation.js"

export type BigNumber = {
    _hex: Hex
    _isBigNumber: boolean
}

export type BundlerRpcSchema = [
    {
        Method: "eth_sendUserOperation"
        Parameters: [
            userOperation: UserOperationWithBigIntAsHex,
            entryPoint: Address
        ]
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
        cumulativeGasUsed: Hex | BigNumber
        status: "0x0" | "0x1"
        gasUsed: Hex | BigNumber
        contractAddress: Address | null
        logsBloom: Hex
        effectiveGasPrice: Hex | BigNumber
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
