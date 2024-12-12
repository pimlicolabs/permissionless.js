import type {
    Address,
    BundlerRpcSchema,
    Chain,
    Client,
    ClientConfig,
    Prettify,
    RpcSchema,
    Transport
} from "viem"
import { createClient } from "viem"
import {
    type BundlerActions,
    type SmartAccount,
    bundlerActions
} from "viem/account-abstraction"
import type { EtherspotBundlerRpcSchema } from "../types/etherspot"
import {
    type EtherspotBundlerActions,
    etherspotBundlerActions
} from "./decorators/etherspot"

export type EtherspotBundlerClient<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
    Client<
        transport,
        chain extends Chain ? chain : undefined,
        account,
        rpcSchema extends RpcSchema
            ? [...BundlerRpcSchema, ...EtherspotBundlerRpcSchema, ...rpcSchema]
            : [...BundlerRpcSchema, ...EtherspotBundlerRpcSchema],
        BundlerActions<account> & EtherspotBundlerActions
    >
>

export type EtherspotClientConfig<
    entryPointVersion extends "0.6" | "0.7" = "0.7" | "0.6",
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
    Pick<
        ClientConfig<transport, chain, account, rpcSchema>,
        | "account"
        | "cacheTime"
        | "chain"
        | "key"
        | "name"
        | "pollingInterval"
        | "rpcSchema"
        | "transport"
    >
> & {
    entryPoint?: {
        address: Address
        version: entryPointVersion
    }
}

export function createEtherspotBundlerClient<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    transport extends Transport = Transport,
    chain extends Chain | undefined = undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: EtherspotClientConfig<
        entryPointVersion,
        transport,
        chain,
        account,
        rpcSchema
    >
): EtherspotBundlerClient<transport, chain, account, rpcSchema>

export function createEtherspotBundlerClient(
    parameters: EtherspotClientConfig
): EtherspotBundlerClient {
    const { key = "public", name = "Etherspot Bundler Client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "etherspotBundlerClient"
    }).extend(bundlerActions)

    return client.extend(etherspotBundlerActions()) as EtherspotBundlerClient
}
