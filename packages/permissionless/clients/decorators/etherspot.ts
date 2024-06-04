import type { Client } from "viem"
import {
    type GetGasPriceResponseReturnType,
    getUserOperationGasPrice
} from "../../actions/etherspot/getUserOperationGasPrice"
import type { Prettify } from "../../types/"

export type EtherspotAccountActions = {
    getUserOperationGasPrice: () => Promise<
        Prettify<GetGasPriceResponseReturnType>
    >
}

export const etherspotAccountActions =
    () =>
    (client: Client): EtherspotAccountActions => ({
        getUserOperationGasPrice: () => getUserOperationGasPrice(client)
    })
