import type { Account, Chain, Client, Transport } from "viem"
import type { BundlerClient } from "../../clients/createBundlerClient"
import type { BundlerRpcSchema } from "../../types/bundler"
import type { EntryPoint } from "../../types/entrypoint"

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
export const supportedEntryPoints = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema<entryPoint>>
): Promise<EntryPoint[]> => {
    return client.request({
        method: "eth_supportedEntryPoints",
        params: []
    })
}
