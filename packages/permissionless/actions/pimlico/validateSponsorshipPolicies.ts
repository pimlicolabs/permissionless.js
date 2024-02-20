import type { Account, Address, Chain, Client, Transport } from "viem"
import type { Prettify } from "../../types/"
import type { PimlicoPaymasterRpcSchema } from "../../types/pimlico"
import type {
    UserOperation,
    UserOperationWithBigIntAsHex
} from "../../types/userOperation"
import { deepHexlify } from "../../utils/deepHexlify"

export type ValidateSponsorshipPoliciesParameters = {
    userOperation: UserOperation
    entryPoint: Address
    sponsorshipPolicyIds: string[]
}

export type ValidateSponsorshipPolicies = {
    sponsorshipPolicyId: string
    data: {
        name: string | null
        author: string | null
        icon: string | null
        description: string | null
    }
}

/**
 * Returns valid sponsorship policies for a userOperation from the list of ids passed
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-paymaster-actions/ValidateSponsorshipPolicies
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
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
 * })
 *
 * await validateSponsorshipPolicies(bundlerClient, {
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
export const validateSponsorshipPolicies = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, PimlicoPaymasterRpcSchema>,
    args: Prettify<ValidateSponsorshipPoliciesParameters>
): Promise<Prettify<ValidateSponsorshipPolicies>[]> => {
    return await client.request({
        method: "pm_validateSponsorshipPolicies",
        params: [
            deepHexlify(args.userOperation) as UserOperationWithBigIntAsHex,
            args.entryPoint,
            args.sponsorshipPolicyIds
        ]
    })
}
