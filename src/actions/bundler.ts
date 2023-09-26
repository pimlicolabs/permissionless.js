import type { Address } from "abitype"
import { type Account, type Chain, type Client, type Hash, type Hex, type Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { UserOperation } from "./types"
import { deepHexlify } from "./utils"

export type sendUserOperationParameters = {
    userOperation: UserOperation
    entryPoint: Address
}

export type estimateUserOperationGasParameters = {
    userOperation: PartialBy<UserOperation, "callGasLimit" | "preVerificationGas" | "verificationGasLimit">
    entryPoint: Address
}

type UserOperationReceipt = {
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

type BundlerRpcSchema = [
    {
        Method: "eth_sendUserOperation"
        Parameters: [userOperation: UserOperation, entryPoint: Address]
        ReturnType: Hash
    },
    {
        Method: "eth_estimateUserOperationGas"
        Parameters: [
            userOperation: PartialBy<UserOperation, "callGasLimit" | "preVerificationGas" | "verificationGasLimit">,
            entryPoint: Address
        ]
        ReturnType: {
            preVerificationGas: bigint
            verificationGasLimit: bigint
            callGasLimit: bigint
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
        ReturnType: bigint
    },
    {
        Method: "eth_getUserOperationByHash"
        Parameters: [hash: Hash]
        ReturnType: {
            userOperation: UserOperation
            entryPoint: Address
            transactionHash: Hash
            blockHash: Hash
            blockNumber: bigint
        }
    },
    {
        Method: "eth_getUserOperationReceipt"
        Parameters: [hash: Hash]
        ReturnType: UserOperationReceipt
    }
]

export type BundlerClient = Client<Transport, Chain, Account, BundlerRpcSchema>

export const sendUserOperation = (client: BundlerClient, args: sendUserOperationParameters) => {
    const { userOperation, entryPoint } = args

    const params: [UserOperation, Address] = [deepHexlify(userOperation) as UserOperation, entryPoint]

    return client.request({
        method: "eth_sendUserOperation",
        params
    })
}

export const estimateUserOperationGas = async (client: BundlerClient, args: estimateUserOperationGasParameters) => {
    const { userOperation, entryPoint } = args

    const params: [UserOperation, Address] = [deepHexlify(userOperation) as UserOperation, entryPoint]

    const response: {
        preVerificationGas: Hex
        verificationGasLimit: Hex
        callGasLimit: Hex
    } = await client.request({
        method: "eth_estimateUserOperationGas",
        params
    })

    return {
        preVerificationGas: BigInt(response.preVerificationGas),
        verificationGasLimit: BigInt(response.verificationGasLimit),
        callGasLimit: BigInt(response.callGasLimit)
    }
}

export const supportedEntryPoints = async (client: BundlerClient) => {
    const params: [] = []

    const response: Address[] = await client.request({
        method: "eth_supportedEntryPoints",
        params
    })

    return response
}

export const chainId = async (client: BundlerClient) => {
    const params: [] = []

    const response: bigint = BigInt(
        await client.request({
            method: "eth_chainId",
            params
        })
    )

    return response
}

export const getUserOperationByHash = async (client: BundlerClient, hash: Hash) => {
    const params: [Hash] = [hash]

    const {
        userOperation,
        entryPoint,
        transactionHash,
        blockHash,
        blockNumber
    }: {
        userOperation: UserOperation
        entryPoint: Address
        transactionHash: Hash
        blockHash: Hash
        blockNumber: Hex
    } = await client.request({
        method: "eth_getUserOperationByHash",
        params
    })

    userOperation.nonce = BigInt(userOperation.nonce)
    userOperation.callGasLimit = BigInt(userOperation.callGasLimit)
    userOperation.verificationGasLimit = BigInt(userOperation.verificationGasLimit)
    userOperation.preVerificationGas = BigInt(userOperation.preVerificationGas)
    userOperation.maxFeePerGas = BigInt(userOperation.maxFeePerGas)
    userOperation.maxPriorityFeePerGas = BigInt(userOperation.maxPriorityFeePerGas)

    return {
        userOperation,
        entryPoint: entryPoint,
        transactionHash: transactionHash,
        blockHash: blockHash,
        blockNumber: BigInt(blockNumber)
    }
}

const getUserOperationReceipt = async (client: BundlerClient, hash: Hash) => {
    const params: [Hash] = [hash]

    const response: UserOperationReceipt = await client.request({
        method: "eth_getUserOperationReceipt",
        params
    })

    console.log(response)

    response.nonce = BigInt(response.nonce)
    response.actualGasUsed = BigInt(response.actualGasUsed)
    response.actualGasCost = BigInt(response.actualGasCost)
    response.receipt.transactionIndex = BigInt(response.receipt.transactionIndex)
    response.receipt.blockNumber = BigInt(response.receipt.blockNumber)
    response.receipt.cumulativeGasUsed = BigInt(response.receipt.cumulativeGasUsed)
    response.receipt.status = response.receipt.status ? BigInt(response.receipt.status) : null
    response.receipt.gasUsed = BigInt(response.receipt.gasUsed)
    response.receipt.effectiveGasPrice = BigInt(response.receipt.effectiveGasPrice)

    response.logs.map((log) => {
        log.blockNumber = BigInt(log.blockNumber)
        log.logIndex = BigInt(log.logIndex)
        log.transactionIndex = BigInt(log.transactionIndex)
    })

    return response
}

export default (client: Client) => ({
    sendUserOperation: (args: sendUserOperationParameters) => sendUserOperation(client as BundlerClient, args),
    estimateUserOperationGas: (args: estimateUserOperationGasParameters) =>
        estimateUserOperationGas(client as BundlerClient, args),
    supportedEntryPoints: () => supportedEntryPoints(client as BundlerClient),
    chainId: () => chainId(client as BundlerClient),
    getUserOperationByHash: (hash: Hash) => getUserOperationByHash(client as BundlerClient, hash),
    getUserOperationReceipt: (hash: Hash) => getUserOperationReceipt(client as BundlerClient, hash)
})
