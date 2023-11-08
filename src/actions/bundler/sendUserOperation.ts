import type { Address, Hash } from "viem"
import type { BundlerClient } from "../../clients/createBundlerClient.js"
import type { UserOperation, UserOperationWithBigIntAsHex } from "../../types/userOperation.js"
import { deepHexlify } from "../../utils/deepHexlify.js"

export type SendUserOperationParameters = {
    userOperation: UserOperation
    entryPoint: Address
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
export const sendUserOperation = async (client: BundlerClient, args: SendUserOperationParameters): Promise<Hash> => {
    const { userOperation, entryPoint } = args

    return client.request({
        method: "eth_sendUserOperation",
        params: [deepHexlify(userOperation) as UserOperationWithBigIntAsHex, entryPoint as Address]
    })
}
