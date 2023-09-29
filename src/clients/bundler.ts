import type { Account, Chain, Client, PublicClientConfig, Transport } from "viem"
import { createClient } from "viem"
import { bundlerActions } from "../actions"
import type { BundlerActions } from "../actions/bundler"
import type { BundlerRpcSchema } from "../types/bundler"

export type BundlerClient = Client<Transport, Chain | undefined, Account | undefined, BundlerRpcSchema, BundlerActions>
/**
 * Creates a EIP-4337 compliant Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/clients/bundlerClient
 *
 * A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.
 *
 * @param config - {@link PublicClientConfig}
 * @returns A Bundler Client. {@link BundlerClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const bundlerClient = createBundlerClient({
 *   chain: mainnet,
 *   transport: http(BUNDLER_URL),
 * })
 */
export const createBundlerClient = <transport extends Transport, chain extends Chain | undefined = undefined>(
    parameters: PublicClientConfig<transport, chain>
): BundlerClient => {
    const { key = "public", name = "Bundler Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "bundlerClient"
    })
    return client.extend(bundlerActions)
}
