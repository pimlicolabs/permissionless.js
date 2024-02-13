import type { Account, BaseError, Chain, Client, Hash, Transport } from "viem"
import type { BundlerClient } from "../../clients/createBundlerClient"
import type { Prettify } from "../../types/"
import type { BundlerRpcSchema } from "../../types/bundler"
import type { EntryPoint, GetEntryPointVersion } from "../../types/entrypoint"
import type {
    UserOperation,
    UserOperationWithBigIntAsHex
} from "../../types/userOperation"
import { deepHexlify } from "../../utils/deepHexlify"
import { getSendUserOperationError } from "../../utils/errors/getSendUserOperationError"

export type SendUserOperationParameters<entryPoint extends EntryPoint> = {
    userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    entryPoint: entryPoint
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
 */
export const sendUserOperation = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema<entryPoint>>,
    args: Prettify<SendUserOperationParameters<entryPoint>>
): Promise<Hash> => {
    const { userOperation, entryPoint } = args

    try {
        const userOperationHash = await client.request({
            method: "eth_sendUserOperation",
            params: [
                deepHexlify(userOperation) as UserOperationWithBigIntAsHex<
                    GetEntryPointVersion<entryPoint>
                >,
                entryPoint
            ]
        })

        return userOperationHash
    } catch (err) {
        throw getSendUserOperationError(
            err as BaseError,
            args as SendUserOperationParameters<entryPoint>
        )
    }
}
