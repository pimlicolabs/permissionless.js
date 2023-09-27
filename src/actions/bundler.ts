import type { Address } from "abitype"
import type { Client, Hash } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { UserOperation, UserOperationReceipt } from "../types"
import type { BundlerClient } from "../types/bundler"
import type { UserOperationWithBigIntAsHex } from "../types/userOperation"
import { deepHexlify } from "./utils"

export type SendUserOperationParameters = {
    userOperation: UserOperation
    entryPoint: Address
}

export type EstimateUserOperationGasParameters = {
    userOperation: PartialBy<UserOperation, "callGasLimit" | "preVerificationGas" | "verificationGasLimit">
    entryPoint: Address
}

export type EstimateUserOperationGasReturnType = {
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

export type GetUserOperationByHash = {
    hash: Hash
}

export type GetUserOperationReceipt = {
    hash: Hash
}

/**
 * Sends user operation to the bundler
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/sendUserOperation
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link SendUserOperationParameters}.
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
export const sendUserOperation = async (client: BundlerClient, args: SendUserOperationParameters): Promise<Hash> => {
    const { userOperation, entryPoint } = args

    return client.request({
        method: "eth_sendUserOperation",
        params: [deepHexlify(userOperation) as UserOperationWithBigIntAsHex, entryPoint as Address]
    })
}

/**
 * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/estimateUserOperationGas
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link EstimateUserOperationGasParameters}
 * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link EstimateUserOperationGasReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { estimateUserOperationGas } from "permissionless/actions"
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
    args: EstimateUserOperationGasParameters
): Promise<EstimateUserOperationGasReturnType> => {
    const { userOperation, entryPoint } = args

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
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/supportedEntryPoints
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @returns Supported entryPoints
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { supportedEntryPoints } from "permissionless/actions"
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
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/chainId
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @returns Supported chain id
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { chainId } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const bundlerChainId = chainId(bundlerClient)
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
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationByHash
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link GetUserOperationByHash} UserOpHash that was returned by {@link sendUserOperation}
 * @returns userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationByHash } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationByHash(bundlerClient, {hash: userOpHash})
 *
 */
export const getUserOperationByHash = async (
    client: BundlerClient,
    { hash }: GetUserOperationByHash
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
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationReceipt
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link GetUserOperationReceipt} UserOpHash that was returned by {@link sendUserOperation}
 * @returns user operation receipt {@link UserOperationReceipt} if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationReceipt } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationReceipt(bundlerClient, {hash: userOpHash})
 *
 */
export const getUserOperationReceipt = async (client: BundlerClient, { hash }: GetUserOperationReceipt) => {
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
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/sendUserOperation
     *
     * @param args {@link SendUserOperationParameters}.
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
    sendUserOperation: async (args: SendUserOperationParameters): Promise<Hash> =>
        sendUserOperation(client as BundlerClient, args),
    /**
     *
     * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/estimateUserOperationGas
     *
     * @param args {@link EstimateUserOperationGasParameters}
     * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link EstimateUserOperationGasReturnType}
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
    estimateUserOperationGas: (args: EstimateUserOperationGasParameters) =>
        estimateUserOperationGas(client as BundlerClient, args),
    /**
     *
     * Returns the supported entrypoints by the bundler service
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/supportedEntryPoints
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
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/chainId
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
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationByHash
     *
     * @param args {@link GetUserOperationByHash} UserOpHash that was returned by {@link sendUserOperation}
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
    getUserOperationByHash: (args: GetUserOperationByHash) => getUserOperationByHash(client as BundlerClient, args),
    /**
     *
     * Returns the user operation receipt from userOpHash
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationReceipt
     *
     * @param args {@link GetUserOperationReceipt} UserOpHash that was returned by {@link sendUserOperation}
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
     * await bundlerClient.getUserOperationReceipt({hash: userOpHash})
     *
     */
    getUserOperationReceipt: (args: GetUserOperationReceipt) => getUserOperationReceipt(client as BundlerClient, args)
})

export default bundlerActions
