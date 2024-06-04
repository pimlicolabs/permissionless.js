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
import { type EtherspotBundlerRpcSchema } from "../types/etherspot"
import {
    type EtherspotAccountActions,
    etherspotAccountActions
} from "./decorators/etherspot"

export type EtherspotBundlerClient = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    EtherspotBundlerRpcSchema,
    EtherspotAccountActions
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
