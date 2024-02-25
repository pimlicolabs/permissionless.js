import type { Client, Hash } from "viem"
import {
    type SendCompressedUserOperationParameters,
    type ValidateSponsorshipPolicies,
    type ValidateSponsorshipPoliciesParameters,
    sendCompressedUserOperation,
    validateSponsorshipPolicies
} from "../../actions/pimlico"
import {
    type GetUserOperationGasPriceReturnType,
    getUserOperationGasPrice
} from "../../actions/pimlico/getUserOperationGasPrice"
import {
    type GetUserOperationStatusParameters,
    type GetUserOperationStatusReturnType,
    getUserOperationStatus
} from "../../actions/pimlico/getUserOperationStatus"
import {
    type PimlicoSponsorUserOperationParameters,
    type SponsorUserOperationReturnType,
    sponsorUserOperation
} from "../../actions/pimlico/sponsorUserOperation"
import type { Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import type { PimlicoBundlerClient, PimlicoPaymasterClient } from "../pimlico"

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
    getUserOperationGasPrice: () => Promise<
        Prettify<GetUserOperationGasPriceReturnType>
    >
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
        args: Prettify<GetUserOperationStatusParameters>
    ) => Promise<Prettify<GetUserOperationStatusReturnType>>
    /**
     * Sends a compressed user operation to the bundler
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/sendCompressedUserOperation
     *
     * @param args {@link SendCompressedUserOperationParameters}.
     * @returns UserOpHash that you can use to track user operation as {@link Hash}.
     *
     * @example
     * import { createClient } from "viem"
     * import { pimlicoBundlerActions } from "permissionless/actions/pimlico"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(pimlicoBundlerActions)
     *
     * const userOpHash = await bundlerClient.sendCompressedUserOperation({
     *     compressedUserOperation,
     *     inflatorAddress,
     *     entryPoint
     * })
     * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
     */
    sendCompressedUserOperation: (
        args: Prettify<
            Omit<SendCompressedUserOperationParameters, "entryPoint">
        >
    ) => Promise<Hash>
}

export const pimlicoBundlerActions =
    <entryPoint extends EntryPoint>(entryPointAddress: entryPoint) =>
    (client: Client): PimlicoBundlerActions => ({
        getUserOperationGasPrice: async () =>
            getUserOperationGasPrice(
                client as PimlicoBundlerClient<entryPoint>
            ),
        getUserOperationStatus: async (
            args: GetUserOperationStatusParameters
        ) =>
            getUserOperationStatus(
                client as PimlicoBundlerClient<entryPoint>,
                args
            ),
        sendCompressedUserOperation: async (
            args: Omit<SendCompressedUserOperationParameters, "entryPoint">
        ) =>
            sendCompressedUserOperation(
                client as PimlicoBundlerClient<entryPoint>,
                {
                    ...args,
                    entryPoint: entryPointAddress
                }
            )
    })

export type PimlicoPaymasterClientActions<entryPoint extends EntryPoint> = {
    /**
     * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
     *
     * https://docs.pimlico.io/permissionless/reference/pimlico-paymaster-actions/sponsorUserOperation
     *
     * @param args {@link PimlicoSponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
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
        args: Omit<
            PimlicoSponsorUserOperationParameters<entryPoint>,
            "entryPoint"
        >
    ) => Promise<Prettify<SponsorUserOperationReturnType<entryPoint>>>

    validateSponsorshipPolicies: (
        args: Prettify<
            Omit<
                ValidateSponsorshipPoliciesParameters<entryPoint>,
                "entryPoint"
            >
        >
    ) => Promise<Prettify<ValidateSponsorshipPolicies>[]>
}

/**
 * Returns valid sponsorship policies for a userOperation from the list of ids passed
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-paymaster-actions/ValidateSponsorshipPolicies
 *
 * @param args {@link ValidateSponsorshipPoliciesParameters} UserOperation you want to sponsor & entryPoint.
 * @returns valid sponsorship policies, see {@link ValidateSponsorshipPolicies}
 *
 * @example
 * import { createClient } from "viem"
 * import { validateSponsorshipPolicies } from "permissionless/actions/pimlico"
 *
 * const bundlerClient = createClient({
 *   chain: goerli,
 *   transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * }).extend(pimlicoPaymasterActions)

 *
 * await bundlerClient.validateSponsorshipPolicies({
 *   userOperation: userOperationWithDummySignature,
 *   entryPoint: entryPoint,
 *   sponsorshipPolicyIds: ["sp_shiny_puma"]
 * })
 * Returns
 * [
 *   {
 *     sponsorshipPolicyId: "sp_shiny_puma",
 *     data: {
 *       name: "Shiny Puma",
 *       author: "Pimlico",
 *       icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4...",
 *       description: "This policy is for testing purposes only"
 *    }
 *   }
 * ]
 */
export const pimlicoPaymasterActions =
    <entryPoint extends EntryPoint>(entryPointAddress: entryPoint) =>
    (client: Client): PimlicoPaymasterClientActions<entryPoint> => ({
        sponsorUserOperation: async (
            args: Omit<
                PimlicoSponsorUserOperationParameters<entryPoint>,
                "entryPoint"
            >
        ) =>
            sponsorUserOperation<entryPoint>(
                client as PimlicoPaymasterClient<entryPoint>,
                {
                    ...args,
                    entryPoint: entryPointAddress
                }
            ),
        validateSponsorshipPolicies: async (
            args: Omit<
                ValidateSponsorshipPoliciesParameters<entryPoint>,
                "entryPoint"
            >
        ) =>
            validateSponsorshipPolicies(
                client as PimlicoPaymasterClient<entryPoint>,
                { ...args, entryPoint: entryPointAddress }
            )
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
