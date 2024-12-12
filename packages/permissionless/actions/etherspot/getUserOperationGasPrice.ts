import type { Account, Chain, Client, Transport } from "viem"
import type { EtherspotBundlerRpcSchema } from "../../types/etherspot.js"

export type GetGasPriceResponseReturnType = {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
}

/**
 * Returns the live gas prices that you can use to send a user operation.
 *
 * @param client that you created using viem's createClient whose transport url is pointing to the Etherspot's bundler.
 * @returns maxFeePerGas & maxPriorityFeePerGas
 */
export const getUserOperationGasPrice = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        EtherspotBundlerRpcSchema
    >
): Promise<GetGasPriceResponseReturnType> => {
    const gasPrice = await client.request({
        method: "skandha_getGasPrice",
        params: []
    })

    return {
        maxFeePerGas: BigInt(gasPrice.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrice.maxPriorityFeePerGas)
    }
}
