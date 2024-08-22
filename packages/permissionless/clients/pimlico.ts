import type {
    BundlerRpcSchema,
    Chain,
    Client,
    ClientConfig,
    Prettify,
    PublicClientConfig,
    RpcSchema,
    Transport
} from "viem"
import { createClient } from "viem"
import {
    type BundlerActions,
    type PaymasterActions,
    type SmartAccount,
    bundlerActions,
    type entryPoint06Address,
    type entryPoint07Address,
    paymasterActions
} from "viem/account-abstraction"
import type { PimlicoRpcSchema } from "../types/pimlico"
import { type PimlicoActions, pimlicoActions } from "./decorators/pimlico"

export type PimlicoClient<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address =
        | typeof entryPoint07Address
        | typeof entryPoint06Address,
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
            PimlicoActions<entryPointAddress, entryPointVersion>
    >
>

export type PimlicoClientConfig<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address =
        | typeof entryPoint07Address
        | typeof entryPoint06Address,
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
    entryPoint: {
        address: entryPointAddress
        version: entryPointVersion
    }
}

/**
 * Creates a pimlico specific Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/clients/pimlicoBundlerClient
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
 *   transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE"),
 * })
 */
export function createPimlicoClient<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address,
    entryPointVersion extends "0.6" | "0.7",
    transport extends Transport,
    chain extends Chain | undefined = undefined,
    account extends SmartAccount | undefined = undefined,
    client extends Client | undefined = undefined,
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: PimlicoClientConfig<
        entryPointAddress,
        entryPointVersion,
        transport,
        chain,
        account,
        rpcSchema
    >
): PimlicoClient<
    entryPointAddress,
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
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "pimlicoBundlerClient"
    })
    return client.extend(bundlerActions).extend(paymasterActions).extend(
        pimlicoActions({
            entryPoint
        })
    )
}
