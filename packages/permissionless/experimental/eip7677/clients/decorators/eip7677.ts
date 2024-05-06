import type { Chain, Client, Transport } from "viem"
import type { Prettify } from "viem/types/utils"
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
import type { Eip7677Client } from "../createEip7677Client"

export type Eip7677Actions<
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
        args: Prettify<
            Omit<
                GetPaymasterStubDataParameters<
                    TEntryPoint,
                    TChain,
                    TChainOverride
                >,
                "entryPoint"
            >
        >
    ) => Promise<GetPaymasterStubDataReturnType<TEntryPoint>>
}

const eip7677Actions =
    <TEntryPoint extends EntryPoint>({
        entryPoint
    }: { entryPoint: TEntryPoint }) =>
    <
        TTransport extends Transport,
        TChain extends Chain | undefined = Chain | undefined
    >(
        client: Client<TTransport, TChain>
    ): Eip7677Actions<TEntryPoint, TChain> => ({
        getPaymasterData: (args) =>
            getPaymasterData(client as Eip7677Client<TEntryPoint, TChain>, {
                userOperation: args.userOperation,
                context: args.context,
                chain: args.chain,
                entryPoint
            }),
        getPaymasterStubData: async (args) =>
            getPaymasterStubData(client as Eip7677Client<TEntryPoint, TChain>, {
                userOperation: args.userOperation,
                context: args.context,
                chain: args.chain,
                entryPoint
            })
    })

export { eip7677Actions }
