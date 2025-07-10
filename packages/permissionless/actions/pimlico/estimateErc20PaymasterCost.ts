import {
    type Account,
    type Address,
    type Chain,
    ChainNotFoundError,
    type Client,
    type GetChainParameter,
    type Transport
} from "viem"
import type { EntryPointVersion, UserOperation } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
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
    entryPointVersion extends EntryPointVersion,
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined = Chain | undefined
> = {
    entryPoint: { version: entryPointVersion; address: Address }
    userOperation: UserOperation<entryPointVersion>
    token: Address
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
    entryPointVersion extends EntryPointVersion,
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined = Chain | undefined
>(
    client: Client<
        Transport,
        TChain,
        Account | undefined,
        PimlicoRpcSchema<entryPointVersion>
    >,
    args: EstimateErc20PaymasterCostParameters<
        entryPointVersion,
        TChain,
        TChainOverride
    >
): Promise<EstimateErc20PaymasterCostReturnType> => {
    const chain = args.chain ?? client.chain

    if (!chain) {
        throw new ChainNotFoundError()
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

    const postOpGas = quotes[0].postOpGas
    const exchangeRate = quotes[0].exchangeRate
    const exchangeRateNativeToUsd = quotes[0].exchangeRateNativeToUsd

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
    const costInUsd = (maxCostInWei * exchangeRateNativeToUsd) / 10n ** 18n

    return {
        costInToken,
        costInUsd
    }
}
