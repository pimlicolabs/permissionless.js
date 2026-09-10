import type { Chain, Client } from "viem"
import type { EntryPoint } from "viem/erc4337"
import type { Address } from "viem/utils"
import {
    type EstimateCostParameters,
    type EstimateCostReturnType,
    estimateCost
} from "../../actions/erc20Paymaster/estimateCost.js"
import {
    type GetTokenQuotesParameters,
    type GetTokenQuotesReturnType,
    getTokenQuotes
} from "../../actions/erc20Paymaster/getTokenQuotes.js"
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
import {
    type ValidateSponsorshipPolicies,
    type ValidateSponsorshipPoliciesParameters,
    validateSponsorshipPolicies
} from "../../actions/pimlico/validateSponsorshipPolicies.js"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import type { Prettify } from "../../types/utils.js"

export type PimlicoActions<
    TChain extends Chain.Chain | undefined,
    entryPointVersion extends EntryPoint.Version = EntryPoint.Version
> = {
    "~schema"?: PimlicoRpcSchema<entryPointVersion> | undefined
    /**
     * Returns the live gas prices that you can use to send a user operation.
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationGasPrice
     *
     * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas {@link GetUserOperationGasPriceReturnType}
     *
     * @example
     * import { http } from "viem"
     * import { PimlicoClient } from "permissionless/pimlico"
     *
     * const pimlicoClient = PimlicoClient.create({
     *     transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE")
     * })
     *
     * await pimlicoClient.getUserOperationGasPrice()
     */
    getUserOperationGasPrice: () => Promise<
        Prettify<GetUserOperationGasPriceReturnType>
    >
    /**
     * Returns the status of the userOperation that is pending in the mempool.
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationStatus
     *
     * @param hash UserOpHash that you must have received from sendUserOperation.
     * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
     *
     * @example
     * import { http } from "viem"
     * import { PimlicoClient } from "permissionless/pimlico"
     *
     * const pimlicoClient = PimlicoClient.create({
     *     transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE")
     * })
     *
     * await pimlicoClient.getUserOperationStatus({ hash: userOpHash })
     */
    getUserOperationStatus: (
        args: Prettify<GetUserOperationStatusParameters>
    ) => Promise<Prettify<GetUserOperationStatusReturnType>>
    sponsorUserOperation: (
        args: Omit<
            SponsorUserOperationParameters<entryPointVersion>,
            "entryPoint"
        >
    ) => Promise<Prettify<SponsorUserOperationReturnType<entryPointVersion>>>
    validateSponsorshipPolicies: (
        args: Prettify<
            Omit<ValidateSponsorshipPoliciesParameters, "entryPointAddress">
        >
    ) => Promise<Prettify<ValidateSponsorshipPolicies>[]>
    getTokenQuotes: <
        TChainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
    >(
        args: Prettify<
            Omit<
                GetTokenQuotesParameters<TChain, TChainOverride>,
                "entryPointAddress"
            >
        >
    ) => Promise<Prettify<GetTokenQuotesReturnType>>
    estimateErc20PaymasterCost: <
        TChainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
    >(
        args: Omit<
            EstimateCostParameters<entryPointVersion, TChain, TChainOverride>,
            "entryPoint"
        >
    ) => Promise<Prettify<EstimateCostReturnType>>
}

export const pimlicoActions =
    <entryPointVersion extends EntryPoint.Version>({
        entryPoint
    }: {
        entryPoint: { address: Address.Address; version: entryPointVersion }
    }) =>
    <TChain extends Chain.Chain | undefined = Chain.Chain | undefined>(
        client: Pick<Client.Client, "request"> & { chain: TChain }
    ): PimlicoActions<TChain, entryPointVersion> => ({
        getUserOperationGasPrice: async () => getUserOperationGasPrice(client),
        getUserOperationStatus: async (
            args: GetUserOperationStatusParameters
        ) => getUserOperationStatus(client, args),
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
            }),
        estimateErc20PaymasterCost: async (args) =>
            estimateCost(client, {
                ...args,
                entryPoint,
                chain: args.chain
            })
    })
