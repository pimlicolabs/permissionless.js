import { type Account, type Chain, Client, type Transport } from "viem"
import type { RpcSchema } from "viem/utils"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"
import type { Prettify } from "../../types/utils.js"
import {
    type PasskeyServerActions,
    passkeyServerActions
} from "../decorators/passkeyServer.js"

type PasskeyServerClientInner<rpcSchema extends RpcSchema.Generic | undefined> =
    Client.Client<
        Chain.Chain | undefined,
        Account.Account | undefined,
        Transport.Transport,
        undefined,
        | PasskeyServerRpcSchema
        | (rpcSchema extends RpcSchema.Generic ? rpcSchema : never),
        PasskeyServerActions
    >

export type PasskeyServerClient<
    rpcSchema extends RpcSchema.Generic | undefined = undefined
> = {
    [key in keyof PasskeyServerClientInner<rpcSchema>]: PasskeyServerClientInner<rpcSchema>[key]
}

export type PasskeyServerClientConfig<
    rpcSchema extends RpcSchema.Generic | undefined = undefined
> = Prettify<
    Pick<
        Client.create.Options<
            Chain.Chain | undefined,
            Account.Account | undefined,
            Transport.Transport,
            undefined,
            rpcSchema extends RpcSchema.Generic ? rpcSchema : never
        >,
        | "account"
        | "cacheTime"
        | "chain"
        | "key"
        | "name"
        | "pollingInterval"
        | "schema"
        | "transport"
    >
>

export function createPasskeyServerClient<
    rpcSchema extends RpcSchema.Generic | undefined = undefined
>(
    parameters: PasskeyServerClientConfig<rpcSchema>
): PasskeyServerClient<rpcSchema>

export function createPasskeyServerClient(
    parameters: PasskeyServerClientConfig
): PasskeyServerClient {
    const { key = "public", name = "Passkey Server Client" } = parameters

    return Client.create({
        ...parameters,
        key,
        name,
        type: "passkeyServerClient"
    }).extend(passkeyServerActions) as unknown as PasskeyServerClient
}
