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
    /**
     * Returns paymasterAndData for gas estimation. Note that this is a dummy signature that won't be accepted by the paymaster, except for gas estimation.
     *
     * @param args {@link GetPaymasterAndDataForEstimateGasParameters} UserOperation you want to sponsor, entryPoint, and chain ID.
     * @returns paymasterAndData with a dummy signature just for gas estimation.
     *
     * @example
     * import { createClient } from "viem"
     * import { basePaymasterActions } from "permissionless/actions/base"
     *
     * const basePaymasterClient = createClient({
     *      transport: http("https://paymaster.base.org")
     * }).extend(basePaymasterActions)
     *
     * await basePaymasterClient.getPaymasterAndDataForEstimateGas({
     *      userOperation: userOperationWithoutPaymaster,,
     *      entryPoint: entryPoint,
     *      chainId: toHex(chainId)
     * })
     *
     */
    getPaymasterAndDataForEstimateGas: (
        args: GetPaymasterAndDataForEstimateGasParameters
    ) => Promise<GetPaymasterAndDataForEstimateGasReturnType>

    /**
     * Returns paymasterAndData for sponsoring a userOp.
     *
     * @param args {@link GetPaymasterAndDataForUserOperationParameters} UserOperation you want to sponsor, entryPoint, and chain ID.
     * @returns paymasterAndData for sponsoring a userOp.
     *
     * @example
     * import { createClient } from "viem"
     * import { basePaymasterActions } from "permissionless/actions/base"
     *
     * const basePaymasterClient = createClient({
     *      transport: http("https://paymaster.base.org")
     * }).extend(basePaymasterActions)
     *
     * await basePaymasterClient.getPaymasterAndDataForUserOperation({
     *      userOperation: userOperation,
     *      entryPoint: entryPoint,
     *      chainId: toHex(chainId)
     * })
     *
     */
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
