import type { Account, Address, Chain, Client, Hash, Transport } from "viem"
import type { BundlerClient } from "../../clients/createBundlerClient"
import type { Prettify } from "../../types/"
import type { BundlerRpcSchema } from "../../types/bundler"
import type { EntryPoint, GetEntryPointVersion } from "../../types/entrypoint"
import type { UserOperation } from "../../types/userOperation"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils/getEntryPointVersion"

export type GetUserOperationByHashParameters = {
    hash: Hash
}

export type GetUserOperationByHashReturnType<entryPoint extends EntryPoint> = {
    userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    entryPoint: Address
    transactionHash: Hash
    blockHash: Hash
    blockNumber: bigint
}

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
export const getUserOperationByHash = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema<entryPoint>>,
    { hash }: Prettify<GetUserOperationByHashParameters>
): Promise<Prettify<GetUserOperationByHashReturnType<entryPoint>> | null> => {
    const params: [Hash] = [hash]

    const response = await client.request({
        method: "eth_getUserOperationByHash",
        params
    })

    if (!response) return null

    const {
        userOperation,
        entryPoint: entryPointAddress,
        transactionHash,
        blockHash,
        blockNumber
    } = response

    return {
        userOperation: (entryPointAddress === ENTRYPOINT_ADDRESS_V06
            ? {
                  ...userOperation,
                  nonce: BigInt(userOperation.nonce),
                  callGasLimit: BigInt(userOperation.callGasLimit),
                  verificationGasLimit: BigInt(
                      userOperation.verificationGasLimit
                  ),
                  preVerificationGas: BigInt(userOperation.preVerificationGas),
                  maxFeePerGas: BigInt(userOperation.maxFeePerGas),
                  maxPriorityFeePerGas: BigInt(
                      userOperation.maxPriorityFeePerGas
                  )
              }
            : {
                  ...userOperation,
                  nonce: BigInt(userOperation.nonce),
                  callGasLimit: BigInt(userOperation.callGasLimit),
                  verificationGasLimit: BigInt(
                      userOperation.verificationGasLimit
                  ),
                  preVerificationGas: BigInt(userOperation.preVerificationGas),
                  maxFeePerGas: BigInt(userOperation.maxFeePerGas),
                  maxPriorityFeePerGas: BigInt(
                      userOperation.maxPriorityFeePerGas
                  ),
                  paymasterVerificationGasLimit:
                      userOperation.paymasterVerificationGasLimit
                          ? BigInt(userOperation.paymasterVerificationGasLimit)
                          : undefined,
                  paymasterPostOpGasLimit:
                      userOperation.paymasterVerificationGasLimit
                          ? BigInt(userOperation.paymasterPostOpGasLimit)
                          : undefined
              }) as UserOperation<GetEntryPointVersion<entryPoint>>,
        entryPoint: entryPointAddress,
        transactionHash: transactionHash,
        blockHash: blockHash,
        blockNumber: BigInt(blockNumber)
    }
}
