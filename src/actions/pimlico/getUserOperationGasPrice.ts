import type { PimlicoBundlerClient } from "../../clients/pimlico"

export type GetUserOperationGasPriceReturnType = {
    slow: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
    standard: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
    fast: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
}

/**
 * Returns the live gas prices that you can use to send a user operation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationGasPrice
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationGasPrice } from "permissionless/actions/pimlico"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await getUserOperationGasPrice(bundlerClient)
 *
 */
export const getUserOperationGasPrice = async (
    client: PimlicoBundlerClient
): Promise<GetUserOperationGasPriceReturnType> => {
    const gasPrices = await client.request({
        method: "pimlico_getUserOperationGasPrice",
        params: []
    })

    return {
        slow: {
            maxFeePerGas: BigInt(gasPrices.slow.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.slow.maxPriorityFeePerGas)
        },
        standard: {
            maxFeePerGas: BigInt(gasPrices.standard.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.standard.maxPriorityFeePerGas)
        },
        fast: {
            maxFeePerGas: BigInt(gasPrices.fast.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.fast.maxPriorityFeePerGas)
        }
    }
}
