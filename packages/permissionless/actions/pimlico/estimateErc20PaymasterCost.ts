import {
    type Account,
    type Address,
    type Chain,
    ChainNotFoundError,
    type Client,
    type GetChainParameter,
    type Transport,
    getAddress,
    slice
} from "viem"
import type { EntryPointVersion, UserOperation } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import { getTokenQuotes } from "./getTokenQuotes.js"

/**
 * @costInToken represents the max amount of token that will be charged for this user operation in token decimals
 * @costInUsd represents the max amount of USD value of the token in 10^6 decimals
 */
export type EstimateErc20PaymasterCostReturnType = {
    costInToken: bigint
    costInUsd: number
}

export type EstimateErc20PaymasterCostParameters<
    entryPointVersion extends EntryPointVersion,
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined = Chain | undefined
> = {
    entryPoint: { version: entryPointVersion; address: Address }
    userOperation: UserOperation<entryPointVersion>
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

    const { entryPoint, userOperation } = args

    const paymasterData = (() => {
        if ("paymasterAndData" in userOperation) {
            return userOperation.paymasterAndData
        }

        if ("paymasterData" in userOperation) {
            return userOperation.paymasterData
        }

        return undefined
    })()

    if (!paymasterData || paymasterData === "0x") {
        throw new Error("Paymaster data not found in the user operation.")
    }

    const token: Address = (() => {
        try {
            if (entryPoint.version === "0.6") {
                return getAddress(slice(paymasterData, 34, 54))
            }

            return getAddress(slice(paymasterData, 46, 66))
        } catch {
            throw new Error(
                "Invalid paymaster data, cannot find token address."
            )
        }
    })()

    const quotes = await getAction(
        client,
        getTokenQuotes,
        "getTokenQuotes"
    )({
        tokens: [token],
        entryPointAddress: entryPoint.address,
        chain
    })

    const postOpGas: bigint = quotes[0].postOpGas
    const exchangeRate: bigint = quotes[0].exchangeRate
    const exchangeRateNativeToUsd: bigint = quotes[0].exchangeRateNativeToUsd

    const userOperationMaxGas = (() => {
        const paymasterVerificationGasLimit =
            "paymasterVerificationGasLimit" in userOperation
                ? (userOperation.paymasterVerificationGasLimit ?? 0n)
                : 0n

        const paymasterPostOpGasLimit =
            "paymasterPostOpGasLimit" in userOperation
                ? (userOperation.paymasterPostOpGasLimit ?? 0n)
                : 0n

        const { preVerificationGas, verificationGasLimit, callGasLimit } =
            userOperation

        return (
            BigInt(preVerificationGas) +
            BigInt(verificationGasLimit) +
            BigInt(callGasLimit) +
            paymasterVerificationGasLimit +
            paymasterPostOpGasLimit
        )
    })()

    const userOperationMaxCost =
        userOperationMaxGas * userOperation.maxFeePerGas

    // represents the userOperation's max cost in denomination of wei
    const maxCostInWei =
        userOperationMaxCost + postOpGas * userOperation.maxFeePerGas

    // represents the userOperation's max cost in token denomination (wei)
    const costInToken = (maxCostInWei * exchangeRate) / BigInt(1e18)

    // represents the userOperation's max cost in usd (with 6 decimals of precision)
    const costInUsd = (maxCostInWei * exchangeRateNativeToUsd) / 10n ** 18n

    return {
        costInToken,
        costInUsd: Number(costInUsd) / 10 ** 6
    }
}
