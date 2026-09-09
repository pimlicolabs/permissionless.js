import type { Chain, Transport, Client as viem_Client } from "viem"
import {
    type AccountAbstractionActions,
    BundlerClient,
    EntryPoint,
    Actions as Erc4337Actions,
    type PaymasterClient,
    type SmartAccount
} from "viem/erc4337"
import type { Address, RpcSchema } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import type { Prettify } from "../../types/utils.js"
import { type PimlicoActions, pimlicoActions } from "../decorators/pimlico.js"

export type { PimlicoRpcSchema as Schema } from "../../types/pimlico.js"

type ResolvedChain<
    chain extends Chain.Chain | undefined,
    client extends viem_Client.Client | undefined
> = chain extends Chain.Chain
    ? chain
    : client extends viem_Client.Client<
            infer chain extends Chain.Chain | undefined
        >
      ? chain
      : undefined

type ClientInner<
    entryPointVersion extends EntryPoint.Version,
    transport extends Transport.Transport,
    chain extends Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined,
    client extends viem_Client.Client | undefined,
    rpcSchema extends RpcSchema.Generic | undefined
> = Omit<
    BundlerClient.Client<
        ResolvedChain<chain, client>,
        account,
        transport,
        client,
        | PimlicoRpcSchema<entryPointVersion>
        | (rpcSchema extends RpcSchema.Generic ? rpcSchema : never),
        AccountAbstractionActions<account> &
            PimlicoActions<chain, entryPointVersion>
    >,
    "paymaster"
> &
    PaymasterClient.Decorator

// Variance annotations referred from viem:
// https://github.com/wevm/viem/blob/main/src/actions/public/simulateContract.ts#L129
export type Client<
    /** @ts-expect-error cast variance */
    out entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
    out transport extends Transport.Transport = Transport.Transport,
    /** @ts-expect-error cast variance */
    out chain extends Chain.Chain | undefined = Chain.Chain | undefined,
    /** @ts-expect-error cast variance */
    out account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    out client extends viem_Client.Client | undefined =
        | viem_Client.Client
        | undefined,
    rpcSchema extends RpcSchema.Generic | undefined = undefined
> = {
    [key in keyof ClientInner<
        entryPointVersion,
        transport,
        chain,
        account,
        client,
        rpcSchema
    >]: ClientInner<
        entryPointVersion,
        transport,
        chain,
        account,
        client,
        rpcSchema
    >[key]
}

export type Config<
    entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
    transport extends Transport.Transport = Transport.Transport,
    chain extends Chain.Chain | undefined = Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    rpcSchema extends RpcSchema.Generic | undefined = undefined
> = Prettify<
    Pick<
        BundlerClient.create.Options<
            chain,
            account,
            transport,
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
> & {
    entryPoint?: {
        address: Address.Address
        version: entryPointVersion
    }
}

export function create<
    entryPointVersion extends EntryPoint.Version = "0.7",
    transport extends Transport.Transport = Transport.Transport,
    chain extends Chain.Chain | undefined = undefined,
    account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    client extends viem_Client.Client | undefined = undefined,
    rpcSchema extends RpcSchema.Generic | undefined = undefined
>(
    parameters: Config<entryPointVersion, transport, chain, account, rpcSchema>
): Client<entryPointVersion, transport, chain, account, client, rpcSchema>

export function create(parameters: Config): Client {
    const {
        key = "public",
        name = "Pimlico Bundler Client",
        entryPoint,
        ...rest
    } = parameters

    const client = BundlerClient.create({ ...rest, key, name })

    const paymaster: PaymasterClient.Decorator["paymaster"] = {
        getData: (options) => Erc4337Actions.paymaster.getData(client, options),
        getStubData: (options) =>
            Erc4337Actions.paymaster.getStubData(client, options)
    }

    return Object.assign(client, { paymaster }).extend(
        pimlicoActions({
            entryPoint: {
                address: entryPoint?.address ?? EntryPoint.addressV07,
                version: entryPoint?.version ?? "0.7"
            }
        })
    ) as unknown as Client
}
