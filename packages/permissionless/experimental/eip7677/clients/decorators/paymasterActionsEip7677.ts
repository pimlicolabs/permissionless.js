import type { Chain, Client, Transport } from "viem"
import type {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
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

export type PaymasterActionsEip7677<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address,
    entryPointVersion extends "0.6" | "0.7",
    TChain extends Chain | undefined
> = {
    getPaymasterData: <
        TChainOverride extends Chain | undefined = Chain | undefined
    >(
        args: Omit<
            GetPaymasterDataParameters<
                entryPointAddress,
                entryPointVersion,
                TChain,
                TChainOverride
            >,
            "entryPoint"
        >
    ) => Promise<GetPaymasterDataReturnType<entryPointVersion>>
    getPaymasterStubData: <
        TChainOverride extends Chain | undefined = Chain | undefined
    >(
        args: Omit<
            GetPaymasterStubDataParameters<
                entryPointAddress,
                entryPointVersion,
                TChain,
                TChainOverride
            >,
            "entryPoint"
        >
    ) => Promise<GetPaymasterStubDataReturnType<entryPointVersion>>
}

const paymasterActionsEip7677 =
    <
        entryPointAddress extends
            | typeof entryPoint06Address
            | typeof entryPoint07Address,
        entryPointVersion extends "0.6" | "0.7"
    >(entryPoint: {
        address: entryPointAddress
        version: entryPointVersion
    }) =>
    <TChain extends Chain | undefined>(
        client: Client<Transport, TChain>
    ): PaymasterActionsEip7677<
        entryPointAddress,
        entryPointVersion,
        TChain
    > => ({
        getPaymasterData: (args) =>
            getPaymasterData(client, {
                userOperation: args.userOperation,
                context: args.context,
                chain: args.chain,
                entryPoint
            }),
        getPaymasterStubData: async (args) =>
            getPaymasterStubData(client, {
                userOperation: args.userOperation,
                context: args.context,
                chain: args.chain,
                entryPoint
            })
    })

export { paymasterActionsEip7677 }
