import type {
    Account,
    Address,
    Chain,
    Client,
    Hash,
    Hex,
    Transport
} from "viem"
import type { Prettify } from "../../types/"
import type { PimlicoBundlerRpcSchema } from "../../types/pimlico"

export type SendCompressedUserOperationParameters = {
    compressedUserOperation: Hex
    inflatorAddress: Address
    entryPoint: Address
}

/**
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
export const sendCompressedUserOperation = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, PimlicoBundlerRpcSchema>,
    args: Prettify<SendCompressedUserOperationParameters>
): Promise<Hash> => {
    const { compressedUserOperation, inflatorAddress, entryPoint } = args

    return client.request({
        method: "pimlico_sendCompressedUserOperation",
        params: [
            compressedUserOperation as Hex,
            inflatorAddress as Address,
            entryPoint as Address
        ]
    })
}
