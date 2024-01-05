import {
    type Account,
    type Chain,
    type Client,
    type PublicClientConfig,
    type Transport,
    createClient
} from "viem"
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

export const createBasePaymasterClient = <
    transport extends Transport,
    chain extends Chain | undefined = undefined
>(
    parameters: PublicClientConfig<transport, chain>
): BasePaymasterClient => {
    const { key = "public", name = "Base Paymaster Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "basePaymasterClient"
    })
    return client.extend(basePaymasterActions)
}
