import type { Chain, Client, Transport } from "viem"
import type { EntryPoint } from "../../../../types/entrypoint"
import {
    type GetPaymasterDataParameters,
    type GetPaymasterDataReturnType,
    getPaymasterData
} from "../../actions/getPaymasterData"
import {
    type GetPaymasterStubDataParameters,
    type GetPaymasterStubDataReturnType,
    getPaymasterStubData
} from "../../actions/getPaymasterStubData"
import type { Eip7677RpcSchema } from "../../types/paymaster"

export type PaymasterActionsEip7677<
    TEntryPoint extends EntryPoint,
    TChain extends Chain | undefined = Chain | undefined
> = {
    getPaymasterData: <
        TChainOverride extends Chain | undefined = Chain | undefined
    >(
        args: Omit<
            GetPaymasterDataParameters<TEntryPoint, TChain, TChainOverride>,
            "entryPoint"
        >
    ) => Promise<GetPaymasterDataReturnType<TEntryPoint>>
    getPaymasterStubData: <
        TChainOverride extends Chain | undefined = Chain | undefined
    >(
        args: Omit<
            GetPaymasterStubDataParameters<TEntryPoint, TChain, TChainOverride>,
            "entryPoint"
        >
    ) => Promise<GetPaymasterStubDataReturnType<TEntryPoint>>
}

const paymasterActionsEip7677 =
    <TEntryPoint extends EntryPoint>(entryPoint: TEntryPoint) =>
    <
        TTransport extends Transport,
        TChain extends Chain | undefined = Chain | undefined
    >(
        client: Client<TTransport, TChain>
    ): PaymasterActionsEip7677<TEntryPoint, TChain> => ({
        getPaymasterData: (args) =>
            getPaymasterData(
                client as Client<
                    TTransport,
                    TChain,
                    undefined,
                    Eip7677RpcSchema<TEntryPoint>
                >,
                {
                    userOperation: args.userOperation,
                    context: args.context,
                    chain: args.chain,
                    entryPoint
                }
            ),
        getPaymasterStubData: async (args) =>
            getPaymasterStubData(
                client as Client<
                    TTransport,
                    TChain,
                    undefined,
                    Eip7677RpcSchema<TEntryPoint>
                >,
                {
                    userOperation: args.userOperation,
                    context: args.context,
                    chain: args.chain,
                    entryPoint
                }
            )
    })

export { paymasterActionsEip7677 }
