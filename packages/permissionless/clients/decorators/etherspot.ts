import type { Client } from "viem"
import {
    type GetGasPriceResponseReturnType,
    getUserOperationGasPrice
} from "../../actions/etherspot/getUserOperationGasPrice"
import {
    type ArkaSponsorUserOperationParameters,
    type SponsorUserOperationReturnType,
    sponsorUserOperation
} from "../../actions/etherspot/sponsorUserOperation"
import type { Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { type ArkaPaymasterClient } from "../etherspot"

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

export type ArkaPaymasterClientActions<entryPoint extends EntryPoint> = {
    /**
     * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
     *
     * @param args {@link ArkaSponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
     * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { polygonAmoy } from 'viem/chains'
     * import { sponsorUserOperation, arkaPaymasterAction } from "permissionless/actions/etherspot"
     *
     * const bundlerClient = createClient({
     *      chain: polygonAmoy,
     *      transport: http("https://arka.etherspot.io?apiKey=YOUR_API_KEY&chainId=${polygonAmoy.id}")
     * }).extend(arkaPaymasterActions)
     *
     * await bundlerClient.sponsorUserOperation(bundlerClient, {
     *      userOperation: userOperationWithDummySignature,
     *      entryPoint: entryPoint
     * }})
     *
     */
    sponsorUserOperation: (
        args: Omit<ArkaSponsorUserOperationParameters<entryPoint>, "entryPoint">
    ) => Promise<Prettify<SponsorUserOperationReturnType<entryPoint>>>
}

export const arkaPaymasterActions =
    <entryPoint extends EntryPoint>(entryPointAddress: entryPoint) =>
    (client: Client): ArkaPaymasterClientActions<entryPoint> => ({
        sponsorUserOperation: async (args) =>
            sponsorUserOperation<entryPoint>(
                client as ArkaPaymasterClient<entryPoint>,
                {
                    ...args,
                    entryPoint: entryPointAddress
                }
            )
    })
