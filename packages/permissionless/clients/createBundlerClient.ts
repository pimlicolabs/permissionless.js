import type {
    Account,
    Chain,
    Client,
    PublicClientConfig,
    Transport
} from "viem"
import { createClient } from "viem"
import type { BundlerRpcSchema } from "../types/bundler"
import type { EntryPoint } from "../types/entrypoint"
import { type BundlerActions, bundlerActions } from "./decorators/bundler"

export type BundlerClient<
    entryPoint extends EntryPoint,
    TChain extends Chain | undefined = Chain | undefined
> = Client<
    Transport,
    TChain,
    Account | undefined,
    BundlerRpcSchema<entryPoint>,
    BundlerActions<entryPoint>
>
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
export const createBundlerClient = <
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = undefined
>(
    parameters: PublicClientConfig<transport, chain> & {
        entryPoint: entryPoint
    }
): BundlerClient<entryPoint> => {
    const { key = "public", name = "Bundler Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "bundlerClient"
    })
    return client.extend(bundlerActions(parameters.entryPoint))
}
