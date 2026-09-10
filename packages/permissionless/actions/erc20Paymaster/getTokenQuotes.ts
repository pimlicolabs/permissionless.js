import { Chain, type Client, type Transport } from "viem"
import { type Address, Hex } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import type { GetChainParameter } from "../../types/utils.js"

export type GetTokenQuotesParameters<
    TChain extends Chain.Chain | undefined,
    TChainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
> = {
    tokens: Address.Address[]
    entryPointAddress: Address.Address
} & GetChainParameter<TChain, TChainOverride>

export type GetTokenQuotesReturnType = {
    paymaster: Address.Address
    token: Address.Address
    postOpGas: bigint
    exchangeRate: bigint
    exchangeRateNativeToUsd: bigint
    balanceSlot?: bigint
    allowanceSlot?: bigint
}[]

/**
 * Returns all related fields to calculate the potential cost of a userOperation in ERC-20 tokens.
 *
 * - Docs: https://docs.pimlico.io/references/paymaster/erc20-paymaster/endpoints/pimlico_getTokenQuotes
 *
 * @param client viem client whose transport points at Pimlico's RPC.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 * @returns quotes, see {@link GetTokenQuotesReturnType}
 *
 */
export const getTokenQuotes = async <
    TChain extends Chain.Chain | undefined,
    TChainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
>(
    client: Pick<Client.Client<TChain>, "chain" | "request">,
    args: GetTokenQuotesParameters<TChain, TChainOverride>
): Promise<GetTokenQuotesReturnType> => {
    const chainId = args.chain?.id ?? client.chain?.id

    if (!chainId) {
        throw new Chain.NotFoundError()
    }

    const request = client.request as Transport.RequestFn<PimlicoRpcSchema>
    const res = await request({
        method: "pimlico_getTokenQuotes",
        params: [
            { tokens: args.tokens },
            args.entryPointAddress,
            Hex.fromNumber(chainId)
        ]
    })

    return res.quotes.map((quote) => ({
        ...quote,
        balanceSlot: quote.balanceSlot
            ? Hex.toBigInt(quote.balanceSlot)
            : undefined,
        allowanceSlot: quote.allowanceSlot
            ? Hex.toBigInt(quote.allowanceSlot)
            : undefined,
        postOpGas: Hex.toBigInt(quote.postOpGas),
        exchangeRate: Hex.toBigInt(quote.exchangeRate),
        exchangeRateNativeToUsd: Hex.toBigInt(quote.exchangeRateNativeToUsd)
    }))
}
