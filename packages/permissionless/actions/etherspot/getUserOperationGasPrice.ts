import type { Client, Transport } from "viem"
import type { EtherspotBundlerRpcSchema } from "../../types/etherspot.js"

export type GetUserOperationGasPriceReturnType = {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
}

/**
 * Returns the live gas prices that you can use to send a user operation.
 *
 * @param client viem client whose transport points at Etherspot's RPC.
 * @returns maxFeePerGas & maxPriorityFeePerGas
 */
export const getUserOperationGasPrice = async (
    client: Pick<Client.Client, "request">
): Promise<GetUserOperationGasPriceReturnType> => {
    const request =
        client.request as Transport.RequestFn<EtherspotBundlerRpcSchema>
    const gasPrice = await request({
        method: "skandha_getGasPrice"
    })

    return {
        maxFeePerGas: BigInt(gasPrice.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrice.maxPriorityFeePerGas)
    }
}
