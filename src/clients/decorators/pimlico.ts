import type { Client, Hash } from "viem"
import {
    type GetUserOperationGasPriceReturnType,
    getUserOperationGasPrice
} from "../../actions/pimlico/getUserOperationGasPrice.js"
import {
    type GetUserOperationStatusParameters,
    type GetUserOperationStatusReturnType,
    getUserOperationStatus
} from "../../actions/pimlico/getUserOperationStatus.js"
import {
    type SponsorUserOperationParameters,
    type SponsorUserOperationReturnType,
    sponsorUserOperation
} from "../../actions/pimlico/sponsorUserOperation.js"
import type {
    PimlicoBundlerClient,
    PimlicoPaymasterClient
} from "../pimlico.js"

export type PimlicoBundlerActions = {
    /**
     * Returns the live gas prices that you can use to send a user operation.
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationGasPrice
     *
     * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas {@link GetUserOperationGasPriceReturnType}
     *
     * @example
     *
     * import { createClient } from "viem"
     * import { pimlicoBundlerActions } from "permissionless/actions/pimlico"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(pimlicoBundlerActions)
     *
     * await bundlerClient.getUserOperationGasPrice()
     */
    getUserOperationGasPrice: () => Promise<GetUserOperationGasPriceReturnType>
    /**
     * Returns the status of the userOperation that is pending in the mempool.
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationStatus
     *
     * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
     * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { pimlicoBundlerActions } from "permissionless/actions/pimlico"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(pimlicoBundlerActions)
     *
     * await bundlerClient.getUserOperationStatus({ hash: userOpHash })
     */
    getUserOperationStatus: (
        args: GetUserOperationStatusParameters
    ) => Promise<GetUserOperationStatusReturnType>
}

export const pimlicoBundlerActions = (
    client: Client
): PimlicoBundlerActions => ({
    getUserOperationGasPrice: async () =>
        getUserOperationGasPrice(client as PimlicoBundlerClient),
    getUserOperationStatus: async (args: GetUserOperationStatusParameters) =>
        getUserOperationStatus(client as PimlicoBundlerClient, args)
})

export type PimlicoPaymasterClientActions = {
    /**
     * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
     *
     * https://docs.pimlico.io/permissionless/reference/pimlico-paymaster-actions/sponsorUserOperation
     *
     * @param args {@link SponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
     * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { sponsorUserOperation } from "permissionless/actions/pimlico"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(pimlicoPaymasterActions)
     *
     * await bundlerClient.sponsorUserOperation(bundlerClient, {
     *      userOperation: userOperationWithDummySignature,
     *      entryPoint: entryPoint
     * }})
     *
     */
    sponsorUserOperation: (
        args: SponsorUserOperationParameters
    ) => Promise<SponsorUserOperationReturnType>
}

export const pimlicoPaymasterActions = (
    client: Client
): PimlicoPaymasterClientActions => ({
    sponsorUserOperation: async (args: SponsorUserOperationParameters) =>
        sponsorUserOperation(client as PimlicoPaymasterClient, args)
})

/**
 * TODO: Add support for pimlicoActions after we support all the actions of v2 of the Pimlico API.
 */
// export const pimlicoActions = (client: Client) => {
//     return {
//         ...pimlicoBundlerActions(client),
//         ...pimlicoPaymasterActions(client)
//     }
// }
