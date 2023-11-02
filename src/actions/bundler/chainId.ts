import type { BundlerClient } from "../../clients/createBundlerClient.js"

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
    return Number(
        await client.request({
            method: "eth_chainId",
            params: []
        })
    )
}
