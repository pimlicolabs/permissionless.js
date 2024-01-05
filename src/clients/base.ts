import {
    type Account,
    type Chain,
    type Client,
    type PublicClientConfig,
    type Transport,
    createClient,
    http
} from "viem"
import type { PartialBy } from "viem/types/utils"
import { type BasePaymasterRpcSchema } from "../types/base.js"
import {
    type BasePaymasterClientActions,
    basePaymasterActions
} from "./decorators/base.js"

export type BasePaymasterClient = Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    BasePaymasterRpcSchema,
    BasePaymasterClientActions
>

/**
 * Creates a Base paymaster client.
 *
 * - Docs: https://github.com/base-org/paymaster
 *
 * @param config - {@link PublicClientConfig}
 * @returns A Base Paymaster Client. {@link BasePaymasterClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 *
 * const basePaymasterClient = createBasePaymasterClient({
 *   transport: http("https://paymaster.base.org"),
 * })
 */
export const createBasePaymasterClient = <
    transport extends Transport,
    chain extends Chain | undefined = undefined
>(
    parameters?: PartialBy<PublicClientConfig<transport, chain>, 'transport'>
): BasePaymasterClient => {
    const client = createClient({
        ...parameters,
        key: parameters?.key ?? "public",
        name: parameters?.name ?? "Base Paymaster Client",
        type: "basePaymasterClient",
        transport: parameters?.transport ?? http("https://paymaster.base.org")
    })
    return client.extend(basePaymasterActions)
}
