import {
    type Account,
    type Chain,
    type Client,
    type PublicClientConfig,
    type Transport,
    createClient
} from "viem"
import type { StackupPaymasterRpcSchema } from "../types/stackup.js"
import { type BundlerActions, bundlerActions } from "./decorators/bundler.js"
import {
    type StackupPaymasterClientActions,
    stackupPaymasterActions
} from "./decorators/stackup.js"

export type StackupPaymasterClient = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    StackupPaymasterRpcSchema,
    StackupPaymasterClientActions & BundlerActions
>

/**
 * Creates a Stackup specific Paymaster Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/clients/stackupPaymasterClient
 *
 * A Stackup Paymaster Client is an interface to "stackup paymaster endpoints" [JSON-RPC API](https://docs.stackup.sh/docs/paymaster-api-rpc-methods) methods such as sponsoring user operation, etc through Stackup Paymaster Actions.
 *
 * @param config - {@link PublicClientConfig}
 * @returns A Stackup Paymaster Client. {@link StackupPaymasterClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const stackupPaymasterClient = createStackupPaymasterClient({
 *   chain: mainnet,
 *   transport: http("https://api.stackup.sh/v2/paymaster/YOUR_API_KEY_HERE"),
 * })
 */
export const createStackupPaymasterClient = <
    transport extends Transport,
    chain extends Chain | undefined = undefined
>(
    parameters: PublicClientConfig<transport, chain>
): StackupPaymasterClient => {
    const { key = "public", name = "Stackup Paymaster Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "stackupPaymasterClient"
    })
    return client.extend(bundlerActions).extend(stackupPaymasterActions)
}
