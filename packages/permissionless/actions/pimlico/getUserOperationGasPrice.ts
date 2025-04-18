import type { Account, Chain, Client, Transport } from "viem"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"

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
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-actions/getUserOperationGasPrice
 *
 * @param client that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationGasPrice } from "permissionless/actions/pimlico"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await getUserOperationGasPrice(bundlerClient)
 *
 */
export const getUserOperationGasPrice = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PimlicoRpcSchema
    >
): Promise<GetUserOperationGasPriceReturnType> => {
    const gasPrice = await client.request({
        method: "pimlico_getUserOperationGasPrice",
        params: []
    })

    return {
        slow: {
            maxFeePerGas: BigInt(gasPrice.slow.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrice.slow.maxPriorityFeePerGas)
        },
        standard: {
            maxFeePerGas: BigInt(gasPrice.standard.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrice.standard.maxPriorityFeePerGas)
        },
        fast: {
            maxFeePerGas: BigInt(gasPrice.fast.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrice.fast.maxPriorityFeePerGas)
        }
    }
}
