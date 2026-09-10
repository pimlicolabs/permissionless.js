import type { Client, Transport } from "viem"
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
 * @param client viem client whose transport points at Pimlico's RPC.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 *
 *
 * @example
 * import { Client, http } from "viem"
 * import { Pimlico } from "permissionless/pimlico"
 *
 * const client = Client.create({
 *     transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await Pimlico.getUserOperationGasPrice(client)
 */
export const getUserOperationGasPrice = async (
    client: Pick<Client.Client, "request">
): Promise<GetUserOperationGasPriceReturnType> => {
    const request = client.request as Transport.RequestFn<PimlicoRpcSchema>
    const gasPrice = await request({
        method: "pimlico_getUserOperationGasPrice"
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
