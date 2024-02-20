import type { Address, Client } from "viem"
import {
    type AccountsParameters,
    accounts
} from "../../actions/stackup/accounts"
import {
    type SponsorUserOperationParameters,
    type SponsorUserOperationReturnType,
    sponsorUserOperation
} from "../../actions/stackup/sponsorUserOperation"
import { type StackupPaymasterClient } from "../stackup"

export type StackupPaymasterClientActions = {
    /**
     * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
     *
     * https://docs.stackup.sh/docs/paymaster-api-rpc-methods#pm_sponsoruseroperation
     *
     * @param args {@link SponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
     * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { stackupPaymasterActions } from "permissionless/actions/stackup"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.stackup.sh/v1/paymaster/YOUR_API_KEY_HERE")
     * }).extend(stackupPaymasterActions)
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

    /**
     * Returns all the Paymaster addresses associated with an EntryPoint that’s owned by this service.
     *
     * https://docs.stackup.sh/docs/paymaster-api-rpc-methods#pm_accounts
     *
     * @param args {@link AccountsParameters} entryPoint for which you want to get list of supported paymasters.
     * @returns paymaster addresses
     *
     * @example
     * import { createClient } from "viem"
     * import { stackupPaymasterActions } from "permissionless/actions/stackup"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.stackup.sh/v1/paymaster/YOUR_API_KEY_HERE")
     * }).extend(stackupPaymasterActions)
     *
     * await bundlerClient.accounts(bundlerClient, {
     *      entryPoint: entryPoint
     * }})
     *
     */
    accounts: (args: AccountsParameters) => Promise<Address[]>
}

export const stackupPaymasterActions = (
    client: Client
): StackupPaymasterClientActions => ({
    sponsorUserOperation: async (args: SponsorUserOperationParameters) =>
        sponsorUserOperation(client as StackupPaymasterClient, args),
    accounts: async (args: AccountsParameters) =>
        accounts(client as StackupPaymasterClient, args)
})
