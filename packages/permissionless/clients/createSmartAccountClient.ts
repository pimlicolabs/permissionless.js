import type { Chain, Client, Transport } from "viem"
import {
    type AccountAbstractionActions,
    BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { RpcSchema } from "viem/utils"
import type { Paymaster, Prettify } from "../types/utils.js"
import {
    type SmartAccountActions,
    smartAccountActions
} from "./decorators/smartAccount.js"

type ResolvedChain<
    chain extends Chain.Chain | undefined,
    client extends Client.Client | undefined
> = chain extends Chain.Chain
    ? chain
    : client extends Client.Client<infer chain extends Chain.Chain | undefined>
      ? chain
      : undefined

type SmartAccountClientInner<
    transport extends Transport.Transport,
    chain extends Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined,
    client extends Client.Client | undefined,
    rpcSchema extends RpcSchema.Generic
> = BundlerClient.Client<
    ResolvedChain<chain, client>,
    account,
    transport,
    client,
    rpcSchema,
    AccountAbstractionActions<account> & SmartAccountActions<chain, account>
>

// Variance annotations referred from viem:
// https://github.com/wevm/viem/blob/main/src/actions/public/simulateContract.ts#L129
export type SmartAccountClient<
    out transport extends Transport.Transport = Transport.Transport,
    out chain extends Chain.Chain | undefined = Chain.Chain | undefined,
    /** @ts-expect-error cast variance */
    out account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    out client extends Client.Client | undefined = Client.Client | undefined,
    /** @ts-expect-error cast variance */
    out rpcSchema extends RpcSchema.Generic = RpcSchema.Generic
> = {
    [key in keyof SmartAccountClientInner<
        transport,
        chain,
        account,
        client,
        rpcSchema
    >]: SmartAccountClientInner<
        transport,
        chain,
        account,
        client,
        rpcSchema
    >[key]
}

export type PrepareUserOperationHook = (
    client: BundlerClient.Client,
    parameters: Erc4337Actions.userOperation.prepare.Options
) => Promise<Erc4337Actions.userOperation.prepare.ReturnType>

export type SmartAccountClientConfig<
    transport extends Transport.Transport = Transport.Transport,
    chain extends Chain.Chain | undefined = Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    client extends Client.Client | undefined = Client.Client | undefined,
    rpcSchema extends RpcSchema.Generic = never
> = Prettify<
    Pick<
        BundlerClient.create.Options<
            chain,
            account,
            transport,
            client,
            rpcSchema
        >,
        | "account"
        | "cacheTime"
        | "chain"
        | "client"
        | "key"
        | "name"
        | "paymasterContext"
        | "pollingInterval"
        | "schema"
    >
> & {
    bundlerTransport: transport
    /** Paymaster configuration. */
    paymaster?: Paymaster | undefined
    /** User Operation configuration. */
    userOperation?:
        | {
              /** Prepares fee properties for the User Operation request. */
              estimateFeesPerGas?:
                  | BundlerClient.UserOperationConfig<account>["estimateFeesPerGas"]
                  | undefined
              /** Prepare User Operation configuration. */
              prepareUserOperation?: PrepareUserOperationHook | undefined
          }
        | undefined
}

export function createSmartAccountClient<
    transport extends Transport.Transport,
    chain extends Chain.Chain | undefined = undefined,
    account extends SmartAccount.SmartAccount | undefined = undefined,
    client extends Client.Client | undefined = undefined,
    rpcSchema extends RpcSchema.Generic = never
>(
    parameters: SmartAccountClientConfig<
        transport,
        chain,
        account,
        client,
        rpcSchema
    >
): SmartAccountClient<transport, chain, account, client, rpcSchema>

export function createSmartAccountClient(
    parameters: SmartAccountClientConfig
): SmartAccountClient {
    const {
        bundlerTransport,
        key = "bundler",
        name = "Bundler Client",
        paymaster,
        userOperation,
        ...rest
    } = parameters

    const client = BundlerClient.create({
        ...rest,
        key,
        name,
        paymaster: paymaster as BundlerClient.Paymaster | undefined,
        transport: bundlerTransport,
        userOperation: userOperation?.estimateFeesPerGas
            ? { estimateFeesPerGas: userOperation.estimateFeesPerGas }
            : undefined
    })

    const prepareUserOperation = userOperation?.prepareUserOperation
    if (!prepareUserOperation) {
        return client.extend(
            smartAccountActions
        ) as unknown as SmartAccountClient
    }

    return client
        .extend((client_) => {
            const client = client_ as unknown as BundlerClient.Client
            return {
                userOperation: {
                    prepare: (
                        parameters: Erc4337Actions.userOperation.prepare.Options
                    ) => prepareUserOperation(client, parameters),
                    send: async (
                        parameters: Erc4337Actions.userOperation.send.Options
                    ) => {
                        const { signature: _, ...request } =
                            await prepareUserOperation(
                                client,
                                parameters as unknown as Erc4337Actions.userOperation.prepare.Options
                            )
                        return Erc4337Actions.userOperation.send(client, {
                            ...request,
                            dataSuffix: "0x",
                            parameters: []
                        } as unknown as Erc4337Actions.userOperation.send.Options)
                    }
                }
            }
        })
        .extend(smartAccountActions) as unknown as SmartAccountClient
}
