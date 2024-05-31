import type { Account, Chain, Client, Transport } from "viem"
import type { Prettify } from "../../types/"
import type { EtherspotBundlerRpcSchema } from "../../types/etherspot"

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
export const getUserOperationGasPrice = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, EtherspotBundlerRpcSchema>
): Promise<Prettify<GetGasPriceResponseReturnType>> => {
    const gasPrice = await client.request({
        method: "skandha_getGasPrice",
        params: []
    })

    return {
        maxFeePerGas: BigInt(gasPrice.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrice.maxPriorityFeePerGas)
    }
}
