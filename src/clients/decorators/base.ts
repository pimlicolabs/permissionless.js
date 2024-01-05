import type { Client } from "viem"
import {
    type GetPaymasterAndDataForEstimateGasParameters,
    type GetPaymasterAndDataForEstimateGasReturnType,
    getPaymasterAndDataForEstimateGas
} from "../../actions/base/getPaymasterAndDataForEstimateGas.js"
import {
    type GetPaymasterAndDataForUserOperationParameters,
    type GetPaymasterAndDataForUserOperationReturnType,
    getPaymasterAndDataForUserOperation
} from "../../actions/base/getPaymasterAndDataForUserOperation.js"
import { type BasePaymasterClient } from "../base.js"

export type BasePaymasterClientActions = {
    getPaymasterAndDataForEstimateGas: (
        args: GetPaymasterAndDataForEstimateGasParameters
    ) => Promise<GetPaymasterAndDataForEstimateGasReturnType>
    getPaymasterAndDataForUserOperation: (
        args: GetPaymasterAndDataForUserOperationParameters
    ) => Promise<GetPaymasterAndDataForUserOperationReturnType>
}

export const basePaymasterActions = (
    client: Client
): BasePaymasterClientActions => ({
    getPaymasterAndDataForEstimateGas: async (
        args: GetPaymasterAndDataForEstimateGasParameters
    ) => getPaymasterAndDataForEstimateGas(client as BasePaymasterClient, args),
    getPaymasterAndDataForUserOperation: async (
        args: GetPaymasterAndDataForUserOperationParameters
    ) =>
        getPaymasterAndDataForUserOperation(client as BasePaymasterClient, args)
})
