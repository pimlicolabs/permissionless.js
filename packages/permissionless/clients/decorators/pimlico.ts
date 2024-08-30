import type { Client, Hash, Prettify } from "viem"
import type {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import {
    type GetTokenQuotesParameters,
    type GetTokenQuotesReturnType,
    type SendCompressedUserOperationParameters,
    type ValidateSponsorshipPolicies,
    type ValidateSponsorshipPoliciesParameters,
    getTokenQuotes,
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

export type PimlicoActions<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address =
        | typeof entryPoint06Address
        | typeof entryPoint07Address,
    entryPointVersion extends "0.6" | "0.7" = "0.6" | "0.7"
> = {
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
    /**
     * @deprecated Use `getPaymasterData` instead
     */
    sponsorUserOperation: (
        args: Omit<
            PimlicoSponsorUserOperationParameters<
                entryPointAddress,
                entryPointVersion
            >,
            "entryPoint"
        >
    ) => Promise<Prettify<SponsorUserOperationReturnType<entryPointVersion>>>
    validateSponsorshipPolicies: (
        args: Prettify<
            Omit<
                ValidateSponsorshipPoliciesParameters<
                    entryPointAddress,
                    entryPointVersion
                >,
                "entryPoint"
            >
        >
    ) => Promise<Prettify<ValidateSponsorshipPolicies>[]>
    getTokenQuotes: (
        args: Prettify<Omit<GetTokenQuotesParameters, "entryPoint">>
    ) => Promise<Prettify<GetTokenQuotesReturnType>>
}

export const pimlicoActions =
    <
        entryPointAddress extends
            | typeof entryPoint06Address
            | typeof entryPoint07Address,
        entryPointVersion extends "0.6" | "0.7"
    >({
        entryPoint
    }: {
        entryPoint: { address: entryPointAddress; version: entryPointVersion }
    }) =>
    (client: Client): PimlicoActions<entryPointAddress, entryPointVersion> => ({
        getUserOperationGasPrice: async () => getUserOperationGasPrice(client),
        getUserOperationStatus: async (
            args: GetUserOperationStatusParameters
        ) => getUserOperationStatus(client, args),
        sendCompressedUserOperation: async (
            args: Omit<SendCompressedUserOperationParameters, "entryPoint">
        ) =>
            sendCompressedUserOperation(client, {
                ...args,
                entryPointAddress: entryPoint.address
            }),
        sponsorUserOperation: async (args) =>
            sponsorUserOperation(client, {
                ...args,
                entryPoint
            }),
        validateSponsorshipPolicies: async (args) =>
            validateSponsorshipPolicies(client, {
                ...args,
                entryPointAddress: entryPoint.address
            }),
        getTokenQuotes: async (args) =>
            getTokenQuotes(client, {
                ...args,
                entryPointAddress: entryPoint.address
            })
    })
