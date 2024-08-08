import type {
    Account,
    Chain,
    Client,
    PublicClientConfig,
    Transport,
    WalletClientConfig
} from "viem"
import { createClient } from "viem"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "../types/"
import type { EntryPoint } from "../types/entrypoint"
import type {
    ArkaPaymasterRpcSchema,
    EtherspotBundlerRpcSchema
} from "../types/etherspot"
import {
    type ArkaPaymasterClientActions,
    type EtherspotAccountActions,
    arkaPaymasterActions,
    etherspotAccountActions
} from "./decorators/etherspot"

export type EtherspotBundlerClient = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    EtherspotBundlerRpcSchema,
    EtherspotAccountActions
>

export type ArkaPaymasterClient<entryPoint extends EntryPoint> = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    ArkaPaymasterRpcSchema<entryPoint>,
    ArkaPaymasterClientActions<entryPoint>
>

/**
 * A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.
 *
 * @param parameters - {@link WalletClientConfig}
 * @returns A Bundler Client. {@link EtherspotBundlerClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const etherspotAccountClient = createEtherspotBundlerClient({
 *   chain: mainnet,
 *   transport: http(BUNDLER_URL),
 *   entryPoint: ENTRYPOINT_ADDRESS_V07
 * })
 */

export function createEtherspotBundlerClient<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    transport extends Transport = Transport,
    chain extends Chain | undefined = undefined
>(
    parameters: PublicClientConfig<transport, chain> & {
        entryPoint: entryPoint
    }
): EtherspotBundlerClient {
    const { key = "public", name = "Etherspot Bundler Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "etherspotBundlerClient"
    })

    return client.extend(etherspotAccountActions()) as EtherspotBundlerClient
}

/**
 * Creates ARKA specific Paymaster Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * @param config - {@link PublicClientConfig}
 * @returns Arka Paymaster Client. {@link ArkaPaymasterClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const arkaPaymasterClient = createArkaPaymasterClient({
 *   chain: mainnet,
 *   transport: http("https://arka.etherspot.io?apiKey=YOUR_API_KEY&chainId=${mainnet.id}"),
 * })
 */
export const createArkaPaymasterClient = <
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = undefined
>(
    parameters: PublicClientConfig<transport, chain> & {
        entryPoint: entryPoint
    }
): ArkaPaymasterClient<entryPoint> => {
    const { key = "public", name = "Arka Paymaster Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "arkaPaymasterClient"
    })
    return client.extend(arkaPaymasterActions(parameters.entryPoint))
}
