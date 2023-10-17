import type { Address } from "viem"
import type { StackupPaymasterClient } from "../../clients/stackup.js"

export type AccountsParameters = {
    entryPoint: Address
}

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
 * import { accounts } from "permissionless/actions/stackup"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.stackup.sh/v1/paymaster/YOUR_API_KEY_HERE")
 * })
 *
 * await accounts(bundlerClient, {
 *      entryPoint: entryPoint
 * }})
 *
 */
export const accounts = async (
    client: StackupPaymasterClient,
    { entryPoint }: AccountsParameters
): Promise<Address[]> => {
    const response = await client.request({
        method: "pm_accounts",
        params: [entryPoint]
    })

    return response
}
