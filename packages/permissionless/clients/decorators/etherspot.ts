import type { Client } from "viem"
import {
    type GetGasPriceResponseReturnType,
    getUserOperationGasPrice
} from "../../actions/etherspot/getUserOperationGasPrice"

export type EtherspotBundlerActions = {
    getUserOperationGasPrice: () => Promise<GetGasPriceResponseReturnType>
}

export const etherspotBundlerActions =
    () =>
    (client: Client): EtherspotBundlerActions => ({
        getUserOperationGasPrice: () => getUserOperationGasPrice(client)
    })
