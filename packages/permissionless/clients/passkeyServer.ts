import type {
    Account,
    Chain,
    Client,
    ClientConfig,
    Prettify,
    RpcSchema,
    Transport
} from "viem"
import { createClient } from "viem"
import type { PasskeyServerRpcSchema } from "../types/passkeyServer.js"
import {
    type PasskeyServerActions,
    passkeyServerActions
} from "./decorators/passkeyServer.js"

export type PasskeyServerClient<
    rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
    Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        rpcSchema extends RpcSchema
            ? [...PasskeyServerRpcSchema, ...rpcSchema]
            : [...PasskeyServerRpcSchema],
        PasskeyServerActions
    >
>

export type PasskeyServerClientConfig<
    rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
    Pick<
        ClientConfig<
            Transport,
            Chain | undefined,
            Account | undefined,
            rpcSchema
        >,
        | "account"
        | "cacheTime"
        | "chain"
        | "key"
        | "name"
        | "pollingInterval"
        | "rpcSchema"
        | "transport"
    >
>

export function createPasskeyServerClient<
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: PasskeyServerClientConfig<rpcSchema>
): PasskeyServerClient<rpcSchema>

export function createPasskeyServerClient(
    parameters: PasskeyServerClientConfig
): PasskeyServerClient {
    const { key = "public", name = "Passkey Server Client" } = parameters

    return createClient({
        ...parameters,
        key,
        name,
        type: "passkeyServerClient"
    }).extend(passkeyServerActions)
}
