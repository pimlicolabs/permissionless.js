import type {
    Chain,
    Client,
    ClientConfig,
    ParseAccount,
    Transport,
    WalletClientConfig
} from "viem"
import { createClient } from "viem"
import { type SmartAccount } from "../accounts/types.js"
import { type SponsorUserOperationMiddleware } from "../actions/smartAccount/prepareUserOperationRequest.js"
import { type BundlerRpcSchema } from "../types/bundler.js"
import type { Prettify } from "../types/index.js"
import {
    type SmartAccountActions,
    smartAccountActions
} from "./decorators/smartAccount.js"

/**
 * TODO:
 *  - Add docs
 *  - Fix typing, 'accounts' is required to signMessage, signTypedData, signTransaction, but not needed here, since account is embedded in the client
 */
export type SmartAccountClient<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined
> = Prettify<
    Client<
        transport,
        chain,
        account,
        BundlerRpcSchema,
        SmartAccountActions<chain, account>
    >
>

export type SmartAccountClientConfig<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
> = Prettify<
    Pick<
        ClientConfig<transport, chain, TAccount>,
        | "account"
        | "cacheTime"
        | "chain"
        | "key"
        | "name"
        | "pollingInterval"
        | "transport"
    >
> &
    SponsorUserOperationMiddleware

/**
 * Creates a EIP-4337 compliant Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/clients/smartAccountClient
 *
 * A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.
 *
 * @param parameters - {@link WalletClientConfig}
 * @returns A Bundler Client. {@link SmartAccountClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const smartAccountClient = createSmartAccountClient({
 *   chain: mainnet,
 *   transport: http(BUNDLER_URL),
 * })
 */

export function createSmartAccountClient<
    TTransport extends Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    parameters: SmartAccountClientConfig<TTransport, TChain, TSmartAccount>
): SmartAccountClient<TTransport, TChain, ParseAccount<TSmartAccount>>

export function createSmartAccountClient(
    parameters: SmartAccountClientConfig
): SmartAccountClient {
    const {
        key = "Account",
        name = "Smart Account Client",
        transport
    } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        transport: (opts) => transport({ ...opts, retryCount: 0 }),
        type: "smartAccountClient"
    })

    return client.extend(
        smartAccountActions({
            sponsorUserOperation: parameters.sponsorUserOperation
        })
    )
}
