type GetGasPriceResponse = {
    maxFeePerGas: string
    maxPriorityFeePerGas: string
}

export type EtherspotBundlerRpcSchema = [
    {
        Method: "skandha_getGasPrice"
        Parameters: []
        ReturnType: GetGasPriceResponse
    }
]
