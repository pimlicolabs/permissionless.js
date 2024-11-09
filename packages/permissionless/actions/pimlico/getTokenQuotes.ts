import {
    type Account,
    type Address,
    type Chain,
    ChainNotFoundError,
    type Client,
    type GetChainParameter,
    type Transport,
    hexToBigInt,
    numberToHex
} from "viem"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"

export type GetTokenQuotesParameters<
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined = Chain | undefined
> = {
    tokens: Address[]
    entryPointAddress: Address
} & GetChainParameter<TChain, TChainOverride>

export type GetTokenQuotesReturnType = {
    paymaster: Address
    token: Address
    postOpGas: bigint
    exchangeRate: bigint
    exchangeRateNativeToUsd: bigint
    balanceSlot?: bigint
    allowanceSlot?: bigint
}[]

/**
 * Returns all related fields to calculate the potential cost of a userOperation in ERC-20 tokens.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getTokenQuotes
 *
 * @param client that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 * @returns quotes, see {@link GetTokenQuotesReturnType}
 *
 */
export const getTokenQuotes = async <
    TChain extends Chain | undefined,
    TTransport extends Transport = Transport,
    TChainOverride extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, Account | undefined, PimlicoRpcSchema>,
    args: GetTokenQuotesParameters<TChain, TChainOverride>
): Promise<GetTokenQuotesReturnType> => {
    const chainId = args.chain?.id ?? client.chain?.id

    if (!chainId) {
        throw new ChainNotFoundError()
    }

    const res = await client.request({
        method: "pimlico_getTokenQuotes",
        params: [
            { tokens: args.tokens },
            args.entryPointAddress,
            numberToHex(chainId)
        ]
    })

    return res.quotes.map((quote) => ({
        ...quote,
        balanceSlot: quote.balanceSlot
            ? hexToBigInt(quote.balanceSlot)
            : undefined,
        allowanceSlot: quote.allowanceSlot
            ? hexToBigInt(quote.allowanceSlot)
            : undefined,
        postOpGas: hexToBigInt(quote.postOpGas),
        exchangeRate: hexToBigInt(quote.exchangeRate),
        exchangeRateNativeToUsd: hexToBigInt(quote.exchangeRateNativeToUsd)
    }))
}
