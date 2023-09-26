import type { Address } from "abitype"
import { type Account, type Chain, type Client, type Hash, type Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { BundlerRpcSchema, UserOperation, UserOperationReceipt, UserOperationWithBigIntAsHex } from "../types"
import { deepHexlify } from "./utils"

export type sendUserOperationParameters = {
    userOperation: UserOperation
    entryPoint: Address
}

export type estimateUserOperationGasParameters = {
    userOperation: PartialBy<UserOperation, "callGasLimit" | "preVerificationGas" | "verificationGasLimit">
    entryPoint: Address
}

export type estimateUserOperationGasReturnType = {
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

export type BundlerClient = Client<Transport, Chain, Account, BundlerRpcSchema>

/**
 * Sends user operation to the bundler
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link sendUserOperationParameters}.
 * @returns UserOpHash that you can use to track user operation as {@link Hash}.
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const userOpHash = sendUserOperation(bundlerClient, {
 *      userOperation: signedUserOperation,
 *      entryPoint: entryPoint
 * })
 *
 * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
 *
 */
export const sendUserOperation = async (client: BundlerClient, args: sendUserOperationParameters): Promise<Hash> => {
    const { userOperation, entryPoint } = args

    const supportedEntryPointsByClient = await supportedEntryPoints(client)

    if (!supportedEntryPointsByClient.includes(entryPoint)) throw new Error("Entry point not supported")

    return client.request({
        method: "eth_sendUserOperation",
        params: [deepHexlify(userOperation) as UserOperationWithBigIntAsHex, entryPoint as Address]
    })
}

/**
 * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link estimateUserOperationGasParameters}
 * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link estimateUserOperationGasReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const gasParameters = estimateUserOperationGas(bundlerClient, {
 *      serOperation: signedUserOperation,
 *      entryPoint: entryPoint
 * })
 *
 * // Return {preVerificationGas: 43492n, verificationGasLimit: 59436n, callGasLimit: 9000n}
 *
 */
export const estimateUserOperationGas = async (
    client: BundlerClient,
    args: estimateUserOperationGasParameters
): Promise<estimateUserOperationGasReturnType> => {
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

/**
 * Returns the supported entrypoints by the bundler service
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @returns Supported entryPoints
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const entryPointsSupported = supportedEntryPoints(bundlerClient)
 * // Return ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']
 *
 */
export const supportedEntryPoints = async (client: BundlerClient): Promise<Address[]> => {
    return client.request({
        method: "eth_supportedEntryPoints",
        params: []
    })
}

/**
 * Returns the supported chain id by the bundler service
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @returns Supported chain id
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const chainId = chainId(bundlerClient)
 * // Return 5n for Goerli
 *
 */
export const chainId = async (client: BundlerClient) => {
    return BigInt(
        await client.request({
            method: "eth_chainId",
            params: []
        })
    )
}

/**
 * Returns the user operation from userOpHash
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param hash {@link Hash} UserOpHash that was returned by {@link sendUserOperation}
 * @returns userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationByHash(bundlerClient, userOpHash)
 *
 */
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

/**
 * Returns the user operation receipt from userOpHash
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param hash {@link Hash} UserOpHash that was returned by {@link sendUserOperation}
 * @returns user operation receipt {@link UserOperationReceipt} if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationReceipt(bundlerClient, userOpHash)
 *
 */
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

const bundlerActions = (client: Client) => ({
    /**
     *
     * Sends user operation to the bundler
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param args {@link sendUserOperationParameters}.
     * @returns UserOpHash that you can use to track user operation as {@link Hash}.
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const userOpHash = await bundlerClient.sendUserOperation({
     *      userOperation: signedUserOperation,
     *      entryPoint: entryPoint
     * })
     *
     * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
     */
    sendUserOperation: async (args: sendUserOperationParameters): Promise<Hash> =>
        sendUserOperation(client as BundlerClient, args),
    /**
     *
     * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param args {@link estimateUserOperationGasParameters}
     * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link estimateUserOperationGasReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const gasParameters = await bundlerClient.estimateUserOperationGas({
     *     userOperation: signedUserOperation,
     *    entryPoint: entryPoint
     * })
     *
     * // Return {preVerificationGas: 43492n, verificationGasLimit: 59436n, callGasLimit: 9000n}
     */
    estimateUserOperationGas: (args: estimateUserOperationGasParameters) =>
        estimateUserOperationGas(client as BundlerClient, args),
    /**
     *
     * Returns the supported entrypoints by the bundler service
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @returns Supported entryPoints
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
     *
     * // Return ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']
     */
    supportedEntryPoints: (): Promise<Address[]> => supportedEntryPoints(client as BundlerClient),
    /**
     *
     * Returns the supported chain id by the bundler service
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @returns Supported chain id
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const chainId = await bundlerClient.chainId()
     * // Return 5n for Goerli
     */
    chainId: () => chainId(client as BundlerClient),
    /**
     *
     * Returns the user operation from userOpHash
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param hash {@link Hash} UserOpHash that was returned by {@link sendUserOperation}
     * @returns userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * await bundlerClient.getUserOperationByHash(userOpHash)
     *
     */
    getUserOperationByHash: (hash: Hash) => getUserOperationByHash(client as BundlerClient, hash),
    /**
     *
     * Returns the user operation receipt from userOpHash
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param hash {@link Hash} UserOpHash that was returned by {@link sendUserOperation}
     * @returns user operation receipt {@link UserOperationReceipt} if found or null
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * await bundlerClient.getUserOperationReceipt(userOpHash)
     *
     */
    getUserOperationReceipt: (hash: Hash) => getUserOperationReceipt(client as BundlerClient, hash)
})

export default bundlerActions
