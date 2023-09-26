import type { Address } from "abitype"
import { type Account, type Chain, type Client, type Hash, type Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { BundlerRpcSchema, UserOperation, UserOperationReceipt, UserOperationWithBigIntAsHex } from "./types"
import { deepHexlify } from "./utils"

export type sendUserOperationParameters = {
    userOperation: UserOperation
    entryPoint: Address
}

export type estimateUserOperationGasParameters = {
    userOperation: PartialBy<UserOperation, "callGasLimit" | "preVerificationGas" | "verificationGasLimit">
    entryPoint: Address
}

export type BundlerClient = Client<Transport, Chain, Account, BundlerRpcSchema>

export const sendUserOperation = async (client: BundlerClient, args: sendUserOperationParameters): Promise<Hash> => {
    const { userOperation, entryPoint } = args

    const supportedEntryPointsByClient = await supportedEntryPoints(client)

    if (!supportedEntryPointsByClient.includes(entryPoint)) throw new Error("Entry point not supported")

    return client.request({
        method: "eth_sendUserOperation",
        params: [deepHexlify(userOperation) as UserOperationWithBigIntAsHex, entryPoint as Address]
    })
}

export const estimateUserOperationGas = async (client: BundlerClient, args: estimateUserOperationGasParameters) => {
    const { userOperation, entryPoint } = args

    const supportedEntryPointsByClient = await supportedEntryPoints(client)

    if (!supportedEntryPointsByClient.includes(entryPoint)) throw new Error("Entry point not supported")

    const response = await client.request({
        method: "eth_estimateUserOperationGas",
        params: [deepHexlify(userOperation) as UserOperationWithBigIntAsHex, entryPoint as Address]
    })

    return {
        preVerificationGas: BigInt(response.preVerificationGas || 0n),
        verificationGasLimit: BigInt(response.verificationGasLimit || 0n),
        callGasLimit: BigInt(response.callGasLimit || 0n)
    }
}

export const supportedEntryPoints = async (client: BundlerClient): Promise<Address[]> => {
    return client.request({
        method: "eth_supportedEntryPoints",
        params: []
    })
}

export const chainId = async (client: BundlerClient) => {
    return BigInt(
        await client.request({
            method: "eth_chainId",
            params: []
        })
    )
}

export const getUserOperationByHash = async (
    client: BundlerClient,
    hash: Hash
): Promise<{
    userOperation: UserOperation
    entryPoint: Address
    transactionHash: Hash
    blockHash: Hash
    blockNumber: bigint
} | null> => {
    const params: [Hash] = [hash]

    const response = await client.request({
        method: "eth_getUserOperationByHash",
        params
    })

    if (!response) return null

    const { userOperation, entryPoint, transactionHash, blockHash, blockNumber } = response

    return {
        userOperation: {
            ...userOperation,
            nonce: BigInt(userOperation.nonce),
            callGasLimit: BigInt(userOperation.callGasLimit),
            verificationGasLimit: BigInt(userOperation.verificationGasLimit),
            preVerificationGas: BigInt(userOperation.preVerificationGas),
            maxFeePerGas: BigInt(userOperation.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(userOperation.maxPriorityFeePerGas)
        } as UserOperation,
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

    if (!response) return null

    const userOperationReceipt: UserOperationReceipt = {
        userOpHash: response.userOpHash,
        sender: response.sender,
        nonce: BigInt(response.nonce),
        actualGasUsed: BigInt(response.actualGasUsed),
        actualGasCost: BigInt(response.actualGasCost),
        success: response.success,
        receipt: {
            transactionHash: response.receipt.transactionHash,
            transactionIndex: BigInt(response.receipt.transactionIndex),
            blockHash: response.receipt.blockHash,
            blockNumber: BigInt(response.receipt.blockNumber),
            from: response.receipt.from,
            to: response.receipt.to,
            cumulativeGasUsed: BigInt(response.receipt.cumulativeGasUsed),
            status: response.receipt.status ? BigInt(response.receipt.status) : null,
            gasUsed: BigInt(response.receipt.gasUsed),
            contractAddress: response.receipt.contractAddress,
            logsBloom: response.receipt.logsBloom,
            effectiveGasPrice: BigInt(response.receipt.effectiveGasPrice)
        },
        logs: response.logs.map((log) => ({
            data: log.data,
            blockNumber: BigInt(log.blockNumber),
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: BigInt(log.logIndex),
            transactionIndex: BigInt(log.transactionIndex),
            address: log.address,
            topics: log.topics
        }))
    }

    return userOperationReceipt
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
