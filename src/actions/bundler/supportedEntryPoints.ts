import type { Address } from "viem"
import type { BundlerClient } from "../../clients/bundler.js"

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
