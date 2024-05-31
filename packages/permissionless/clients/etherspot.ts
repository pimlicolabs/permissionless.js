import type {
    Chain,
    Client,
    ClientConfig,
    Transport,
    WalletClientConfig
} from "viem"
import { createClient } from "viem"
import { type SmartAccount } from "../accounts/types"
import { type Middleware } from "../actions/etherspot/prepareUserOperationRequest"
import type { Prettify } from "../types/"
import { type BundlerRpcSchema } from "../types/bundler"
import type { EntryPoint } from "../types/entrypoint"
import {
    type EtherspotAccountActions,
    etherspotAccountActions
} from "./decorators/etherspot"

export type EtherspotBundlerClient<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = Prettify<
    Client<
        transport,
        chain,
        account,
        BundlerRpcSchema<entryPoint>,
        EtherspotAccountActions<entryPoint, chain, account>
    >
>

export type EtherspotBundlerClientConfig<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = Prettify<
    Pick<
        ClientConfig<transport, chain, account>,
        "cacheTime" | "chain" | "key" | "name" | "pollingInterval"
    > &
        Middleware<entryPoint> & {
            account: account
            bundlerTransport: Transport
        } & {
            entryPoint?: entryPoint
        }
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
 * })
 */

export function createEtherspotBundlerClient<
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = undefined,
    TEntryPoint extends EntryPoint = TSmartAccount extends SmartAccount<infer U>
        ? U
        : never
>(
    parameters: EtherspotBundlerClientConfig<
        TEntryPoint,
        TTransport,
        TChain,
        TSmartAccount
    >
): EtherspotBundlerClient<TEntryPoint, TTransport, TChain, TSmartAccount> {
    const {
        key = "public",
        name = "Etherspot Bundler Client",
        bundlerTransport
    } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        transport: bundlerTransport,
        type: "etherspotBundlerClient"
    })

    return client.extend(
        etherspotAccountActions({
            middleware: parameters.middleware
        })
    ) as EtherspotBundlerClient<TEntryPoint, TTransport, TChain, TSmartAccount>
}
