import type {
    BundlerRpcSchema,
    Chain,
    Client,
    ClientConfig,
    EstimateFeesPerGasReturnType,
    Prettify,
    RpcSchema,
    Transport
} from "viem"
import {
    type BundlerActions,
    type BundlerClientConfig,
    type PaymasterActions,
    type SmartAccount,
    type UserOperationRequest,
    createBundlerClient
} from "viem/account-abstraction"
import {
    type SmartAccountActions,
    smartAccountActions
} from "./decorators/smartAccount"

/**
 * TODO:
 *  - Add docs
 *  - Fix typing, 'accounts' is required to signMessage, signTypedData, signTransaction, but not needed here, since account is embedded in the client
 */
export type SmartAccountClient<
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
            : client extends Client<any, infer chain>
              ? chain
              : undefined,
        account,
        rpcSchema extends RpcSchema
            ? [...BundlerRpcSchema, ...rpcSchema]
            : BundlerRpcSchema,
        BundlerActions<account> & SmartAccountActions<chain, account>
    >
> & {
    client: client
    paymaster: BundlerClientConfig["paymaster"] | undefined
    paymasterContext: BundlerClientConfig["paymasterContext"] | undefined
    userOperation: BundlerClientConfig["userOperation"] | undefined
}

export type SmartAccountClientConfig<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    client extends Client | undefined = Client | undefined,
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
    >
> & {
    bundlerTransport: transport
    /** Client that points to an Execution RPC URL. */
    client?: client | Client | undefined
    /** Paymaster configuration. */
    paymaster?:
        | true
        | {
              /** Retrieves paymaster-related User Operation properties to be used for sending the User Operation. */
              getPaymasterData?:
                  | PaymasterActions["getPaymasterData"]
                  | undefined
              /** Retrieves paymaster-related User Operation properties to be used for gas estimation. */
              getPaymasterStubData?:
                  | PaymasterActions["getPaymasterStubData"]
                  | undefined
          }
        | undefined
    /** Paymaster context to pass to `getPaymasterData` and `getPaymasterStubData` calls. */
    paymasterContext?: unknown
    /** User Operation configuration. */
    userOperation?:
        | {
              /** Prepares fee properties for the User Operation request. */
              estimateFeesPerGas?:
                  | ((parameters: {
                        account: account | SmartAccount
                        bundlerClient: Client
                        userOperation: UserOperationRequest
                    }) => Promise<EstimateFeesPerGasReturnType<"eip1559">>)
                  | undefined
          }
        | undefined
}

export function createSmartAccountClient<
    transport extends Transport,
    chain extends Chain | undefined = undefined,
    account extends SmartAccount | undefined = undefined,
    client extends Client | undefined = undefined,
    rpcSchema extends RpcSchema | undefined = undefined
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
        client: client_,
        key = "bundler",
        name = "Bundler Client",
        paymaster,
        paymasterContext,
        bundlerTransport,
        userOperation
    } = parameters

    const client = createBundlerClient({
        ...parameters,
        chain: parameters.chain ?? client_?.chain,
        key,
        name,
        transport: bundlerTransport,
        paymaster,
        paymasterContext,
        userOperation
    })

    return client.extend(smartAccountActions()) as unknown as SmartAccountClient
}
