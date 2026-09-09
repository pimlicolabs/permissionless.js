import type { RpcSchema } from "viem/utils"

type GetGasPriceResponse = {
    maxFeePerGas: string
    maxPriorityFeePerGas: string
}

export type EtherspotBundlerRpcSchema = RpcSchema.From<{
    Request: {
        method: "skandha_getGasPrice"
        params?: undefined
    }
    ReturnType: GetGasPriceResponse
}>
