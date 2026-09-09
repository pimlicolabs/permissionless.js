import { Chain, type Client } from "viem"
import type { EntryPoint, UserOperation } from "viem/erc4337"
import type { Address } from "viem/utils"
import type { GetChainParameter } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import { getRequiredPrefund } from "../../utils/getRequiredPrefund.js"
import { getTokenQuotes } from "./getTokenQuotes.js"

/**
 * @costInToken represents the max amount of token that will be charged for this user operation in token decimals
 * @costInUsd represents the max amount of USD value of the token in 10^6 decimals
 */
export type EstimateErc20PaymasterCostReturnType = {
    costInToken: bigint
    costInUsd: bigint
}

export type EstimateErc20PaymasterCostParameters<
    entryPointVersion extends EntryPoint.Version,
    TChain extends Chain.Chain | undefined,
    TChainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
> = {
    entryPoint: { version: entryPointVersion; address: Address.Address }
    userOperation: UserOperation.UserOperation<entryPointVersion>
    token: Address.Address
} & GetChainParameter<TChain, TChainOverride>

/**
 * Returns all related fields to calculate the potential cost of a userOperation in ERC-20 tokens.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/EstimateErc20PaymasterCost
 *
 * @param client that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @returns quotes, see {@link EstimateErc20PaymasterCostReturnType}
 *
 */
export const estimateErc20PaymasterCost = async <
    entryPointVersion extends EntryPoint.Version,
    TChain extends Chain.Chain | undefined,
    TChainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
>(
    client: Pick<Client.Client<TChain>, "chain" | "request">,
    args: EstimateErc20PaymasterCostParameters<
        entryPointVersion,
        TChain,
        TChainOverride
    >
): Promise<EstimateErc20PaymasterCostReturnType> => {
    const chain = args.chain ?? client.chain

    if (!chain) {
        throw new Chain.NotFoundError()
    }

    const { entryPoint, userOperation, token } = args

    const quotes = await getAction(
        client,
        getTokenQuotes,
        "getTokenQuotes"
    )({
        tokens: [token],
        entryPointAddress: entryPoint.address,
        chain
    })

    const quote = quotes[0]

    if (quote === undefined) {
        throw new Error(`No token quote found for ${token}`)
    }

    const postOpGas = quote.postOpGas
    const exchangeRate = quote.exchangeRate
    const exchangeRateNativeToUsd = quote.exchangeRateNativeToUsd

    const userOperationMaxCost = getRequiredPrefund({
        userOperation,
        entryPointVersion: entryPoint.version
    })

    // represents the userOperation's max cost in denomination of wei
    const maxCostInWei =
        userOperationMaxCost + postOpGas * userOperation.maxFeePerGas

    // represents the userOperation's max cost in token denomination (wei)
    const costInToken = (maxCostInWei * exchangeRate) / BigInt(1e18)

    // represents the userOperation's max cost in usd (with 6 decimals of precision)
    const costInUsd = (maxCostInWei * exchangeRateNativeToUsd) / BigInt(1e18)

    return {
        costInToken,
        costInUsd
    }
}
