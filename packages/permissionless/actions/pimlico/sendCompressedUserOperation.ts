import type {
    Account,
    Address,
    Chain,
    Client,
    Hash,
    Hex,
    Transport
} from "viem"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"

export type SendCompressedUserOperationParameters = {
    compressedUserOperation: Hex
    inflatorAddress: Address
    entryPointAddress: Address
}

/**
 * @deprecated pimlico_sendCompressedUserOperation has been deprecated due to EIP-4844 blobs. Please use sendUserOperation instead.
 * Sends a compressed user operation to the bundler
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/sendCompressedUserOperation
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param args {@link SendCompressedUserOperationParameters}.
 * @returns UserOpHash that you can use to track user operation as {@link Hash}.
 *
 * @example
 * import { pimlicoBundlerActions, sendCompressedUserOperation } from 'permissionless/actions/pimlico'
 * import { createClient } from "viem"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * }).extend(pimlicoBundlerActions(entryPoint))
 *
 * const userOpHash = await sendCompressedUserOperation(bundlerClient, {
 *     compressedUserOperation,
 *     inflatorAddress,
 *     entryPoint
 * })
 * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
 */
export const sendCompressedUserOperation = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PimlicoRpcSchema
    >,
    args: SendCompressedUserOperationParameters
): Promise<Hash> => {
    const { compressedUserOperation, inflatorAddress, entryPointAddress } = args

    return client.request({
        method: "pimlico_sendCompressedUserOperation",
        params: [compressedUserOperation, inflatorAddress, entryPointAddress]
    })
}
