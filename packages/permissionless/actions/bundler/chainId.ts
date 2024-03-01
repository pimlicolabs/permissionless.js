import type { Account, Chain, Client, Transport } from "viem"
import type { BundlerClient } from "../../clients/createBundlerClient"
import type { EntryPoint } from "../../types"
import type { BundlerRpcSchema } from "../../types/bundler"

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
export const chainId = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema<entryPoint>>
) => {
    return Number(
        await client.request({
            method: "eth_chainId",
            params: []
        })
    )
}
