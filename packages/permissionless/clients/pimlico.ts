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
    type PaymasterActions,
    type SmartAccount,
    bundlerActions,
    entryPoint07Address,
    paymasterActions
} from "viem/account-abstraction"
import type { PimlicoRpcSchema } from "../types/pimlico.js"
import { type PimlicoActions, pimlicoActions } from "./decorators/pimlico.js"

export type PimlicoClient<
    entryPointVersion extends "0.6" | "0.7" = "0.7" | "0.6",
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    client extends Client | undefined = Client | undefined,
    rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
    Client<
        transport,
        chain extends Chain
            ? chain
            : // biome-ignore lint/suspicious/noExplicitAny: We need any to infer the chain type
              client extends Client<any, infer chain>
              ? chain
              : undefined,
        account,
        rpcSchema extends RpcSchema
            ? [...BundlerRpcSchema, ...PimlicoRpcSchema, ...rpcSchema]
            : [...BundlerRpcSchema, ...PimlicoRpcSchema],
        BundlerActions<account> &
            PaymasterActions &
            PimlicoActions<chain, entryPointVersion>
    >
>

export type PimlicoClientConfig<
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

export function createPimlicoClient<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    transport extends Transport = Transport,
    chain extends Chain | undefined = undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    client extends Client | undefined = undefined,
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: PimlicoClientConfig<
        entryPointVersion,
        transport,
        chain,
        account,
        rpcSchema
    >
): PimlicoClient<
    entryPointVersion,
    transport,
    chain,
    account,
    client,
    rpcSchema
>

export function createPimlicoClient(
    parameters: PimlicoClientConfig
): PimlicoClient {
    const {
        key = "public",
        name = "Pimlico Bundler Client",
        entryPoint
    } = parameters

    return createClient({
        ...parameters,
        key,
        name,
        type: "pimlicoClient"
    })
        .extend(bundlerActions)
        .extend(paymasterActions)
        .extend(
            pimlicoActions({
                entryPoint: {
                    address: entryPoint?.address ?? entryPoint07Address,
                    version: entryPoint?.version ?? "0.7"
                }
            })
        )
}
