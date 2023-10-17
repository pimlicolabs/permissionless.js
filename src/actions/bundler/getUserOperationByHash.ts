import type { Address, Hash } from "viem"
import type { BundlerClient } from "../../clients/bundler"
import type { UserOperation } from "../../types/userOperation"

export type GetUserOperationByHashParameters = {
    hash: Hash
}

export type GetUserOperationByHashReturnType = {
    userOperation: UserOperation
    entryPoint: Address
    transactionHash: Hash
    blockHash: Hash
    blockNumber: bigint
} | null

/**
 * Returns the user operation from userOpHash
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationByHash
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link GetUserOperationByHashParameters} UserOpHash that was returned by {@link sendUserOperation}
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
    { hash }: GetUserOperationByHashParameters
): Promise<GetUserOperationByHashReturnType> => {
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
