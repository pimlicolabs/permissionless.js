import type { Client, Hash } from "viem"
import type { PimlicoBundlerClient, PimlicoUserOperationGasPrice } from "../types/pimlico"

const getUserOperationGasPrice = async (client: PimlicoBundlerClient): Promise<PimlicoUserOperationGasPrice> => {
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

const getUserOperationStatus = async (client: PimlicoBundlerClient, hash: Hash) => {
    return client.request({
        method: "pimlico_getUserOperationStatus",
        params: [hash]
    })
}

export const pimlicoBundlerActions = (client: Client) => ({
    getUserOperationGasPrice: async () => getUserOperationGasPrice(client as PimlicoBundlerClient),
    getUserOperationStatus: async (hash: Hash) => getUserOperationStatus(client as PimlicoBundlerClient, hash)
})

// export const pimlicoPaymasterActions = (client: Client) => ({})

export const pimlicoActions = (client: Client) => {
    return {
        ...pimlicoBundlerActions(client)
        // ...pimlicoPaymasterActions(client)
    }
}
