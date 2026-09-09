import {
    type Account,
    type Chain,
    type Transport,
    Client as viem_Client
} from "viem"
import type { RpcSchema } from "viem/utils"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"
import type { Prettify } from "../../types/utils.js"
import {
    type PasskeyServerActions,
    passkeyServerActions
} from "../decorators/passkeyServer.js"

export type { PasskeyServerRpcSchema as Schema } from "../../types/passkeyServer.js"

type ClientInner<rpcSchema extends RpcSchema.Generic | undefined> =
    viem_Client.Client<
        Chain.Chain | undefined,
        Account.Account | undefined,
        Transport.Transport,
        undefined,
        | PasskeyServerRpcSchema
        | (rpcSchema extends RpcSchema.Generic ? rpcSchema : never),
        PasskeyServerActions
    >

export type Client<
    rpcSchema extends RpcSchema.Generic | undefined = undefined
> = {
    [key in keyof ClientInner<rpcSchema>]: ClientInner<rpcSchema>[key]
}

export type Config<
    rpcSchema extends RpcSchema.Generic | undefined = undefined
> = Prettify<
    Pick<
        viem_Client.create.Options<
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

export function create<
    rpcSchema extends RpcSchema.Generic | undefined = undefined
>(parameters: Config<rpcSchema>): Client<rpcSchema>

export function create(parameters: Config): Client {
    const { key = "public", name = "Passkey Server Client" } = parameters

    return viem_Client
        .create({
            ...parameters,
            key,
            name,
            type: "passkeyServerClient"
        })
        .extend(passkeyServerActions) as unknown as Client
}
