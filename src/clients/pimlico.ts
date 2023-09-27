import type { Account, Chain, Client, PublicClientConfig, Transport } from "viem"
import { createClient } from "viem"
import { bundlerActions } from "../actions"
import type { BundlerActions } from "../actions/bundler"
import {
    type PimlicoBundlerActions,
    type PimlicoPaymasterClientActions,
    pimlicoBundlerActions,
    pimlicoPaymasterActions
} from "../actions/pimlico"
import type { PimlicoBundlerRpcSchema, PimlicoPaymasterRpcSchema } from "../types/pimlico"

export type PimlicoBundlerClient = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    PimlicoBundlerRpcSchema,
    PimlicoBundlerActions & BundlerActions
>

export type PimlicoPaymasterClient = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    PimlicoPaymasterRpcSchema,
    PimlicoPaymasterClientActions
>

/**
 * Creates a pimlico specific Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * A Pimlico Client is an interface to "pimlico endpoints" [JSON-RPC API](https://docs.pimlico.io/reference/bundler/endpoints) methods such as getting current blockchain gas prices, getting user operation status, etc through [Pimlico Bundler Actions](TODO://Add bundler action documentation link).
 *
 * @param config - {@link PublicClientConfig}
 * @returns A Pimlico Bundler Client. {@link PimlicoBundlerClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const pimlicoBundlerClient = createPimlicoBundlerClient({
 *   chain: mainnet,
 *   transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE"),
 * })
 */
export const createPimlicoBundlerClient = <transport extends Transport, chain extends Chain | undefined = undefined>(
    parameters: PublicClientConfig<transport, chain>
): PimlicoBundlerClient => {
    const { key = "public", name = "Pimlico Bundler Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "pimlicoBundlerClient"
    })
    return client.extend(bundlerActions).extend(pimlicoBundlerActions)
}

/**
 * Creates a pimlico specific Paymaster Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * A Pimlico Paymaster Client is an interface to "pimlico paymaster endpoints" [JSON-RPC API](https://docs.pimlico.io/reference/verifying-paymaster/endpoints) methods such as sponsoring user operation, etc through [Pimlico Paymaster Actions](TODO://Add bundler action documentation link).
 *
 * @param config - {@link PublicClientConfig}
 * @returns A Pimlico Paymaster Client. {@link PimlicoPaymasterClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const pimlicoPaymasterClient = createPimlicoPaymasterClient({
 *   chain: mainnet,
 *   transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE"),
 * })
 */
export const createPimlicoPaymasterClient = <transport extends Transport, chain extends Chain | undefined = undefined>(
    parameters: PublicClientConfig<transport, chain>
): PimlicoPaymasterClient => {
    const { key = "public", name = "Pimlico Paymaster Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "pimlicoPaymasterClient"
    })
    return client.extend(pimlicoPaymasterActions)
}
