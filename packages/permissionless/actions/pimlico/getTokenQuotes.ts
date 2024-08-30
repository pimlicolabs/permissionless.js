import {
    hexToBigInt,
    numberToHex,
    type Account,
    type Address,
    type Chain,
    type Client,
    type Transport
} from "viem"
import type { PimlicoRpcSchema } from "../../types/pimlico"

export type GetTokenQuotesParameters = {
    tokens: Address[]
    entryPointAddress: Address
    chainId: bigint
}

export type GetTokenQuotesReturnType = {
    paymaster: Address
    token: Address
    postOpGas: bigint
    exchangeRate: bigint
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
export const getTokenQuotes = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PimlicoRpcSchema
    >,
    args: GetTokenQuotesParameters
): Promise<GetTokenQuotesReturnType> => {
    const res = await client.request({
        method: "pimlico_getTokenQuotes",
        params: [
            { tokens: args.tokens },
            args.entryPointAddress,
            numberToHex(args.chainId)
        ]
    })

    return {
        ...res.quotes.map((quote) => ({
            ...quote,
            postOpGas: hexToBigInt(quote.postOpGas),
            exchangeRate: hexToBigInt(quote.exchangeRate)
        }))
    }
}
