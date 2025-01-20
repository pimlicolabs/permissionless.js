import type { Address, Chain, Client, Hash, Prettify, Transport } from "viem"
import {
    type GetTokenQuotesParameters,
    type GetTokenQuotesReturnType,
    type SendCompressedUserOperationParameters,
    type ValidateSponsorshipPolicies,
    type ValidateSponsorshipPoliciesParameters,
    getTokenQuotes,
    sendCompressedUserOperation,
    validateSponsorshipPolicies
} from "../../actions/pimlico.js"
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
    type PimlicoSponsorUserOperationParameters,
    type SponsorUserOperationReturnType,
    sponsorUserOperation
} from "../../actions/pimlico/sponsorUserOperation.js"

export type PimlicoActions<
    TChain extends Chain | undefined,
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
     * @deprecated pimlico_sendCompressedUserOperation has been deprecated due to EIP-4844 blobs. Please use sendUserOperation instead.
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
            Omit<SendCompressedUserOperationParameters, "entryPointAddress">
        >
    ) => Promise<Hash>
    /**
     * @deprecated Use `getPaymasterData` instead
     */
    sponsorUserOperation: (
        args: Omit<
            PimlicoSponsorUserOperationParameters<entryPointVersion>,
            "entryPoint"
        >
    ) => Promise<Prettify<SponsorUserOperationReturnType<entryPointVersion>>>
    validateSponsorshipPolicies: (
        args: Prettify<
            Omit<ValidateSponsorshipPoliciesParameters, "entryPointAddress">
        >
    ) => Promise<Prettify<ValidateSponsorshipPolicies>[]>
    getTokenQuotes: <
        TChainOverride extends Chain | undefined = Chain | undefined
    >(
        args: Prettify<
            Omit<
                GetTokenQuotesParameters<TChain, TChainOverride>,
                "entryPointAddress"
            >
        >
    ) => Promise<Prettify<GetTokenQuotesReturnType>>
}

export const pimlicoActions =
    <entryPointVersion extends "0.6" | "0.7">({
        entryPoint
    }: {
        entryPoint: { address: Address; version: entryPointVersion }
    }) =>
    <
        TTransport extends Transport,
        TChain extends Chain | undefined = Chain | undefined
    >(
        client: Client<TTransport, TChain>
    ): PimlicoActions<TChain, entryPointVersion> => ({
        getUserOperationGasPrice: async () => getUserOperationGasPrice(client),
        getUserOperationStatus: async (
            args: GetUserOperationStatusParameters
        ) => getUserOperationStatus(client, args),
        sendCompressedUserOperation: async (args) =>
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
                chain: args.chain,
                entryPointAddress: entryPoint.address
            })
    })
