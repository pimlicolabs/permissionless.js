import type { Client, Transport } from "viem"
import type { UserOperation } from "viem/erc4337"
import type { Address } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import { deepHexlify } from "../../utils/deepHexlify.js"

export type ValidateSponsorshipPoliciesParameters = {
    userOperation: UserOperation.UserOperation
    entryPointAddress: Address.Address
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
 * @param client viem client whose transport points at Pimlico's RPC.
 * @param args {@link ValidateSponsorshipPoliciesParameters} UserOperation you want to sponsor & entryPointAddress.
 * @returns valid sponsorship policies, see {@link ValidateSponsorshipPolicies}
 *
 * @example
 * import { Client, http } from "viem"
 * import { EntryPoint } from "viem/erc4337"
 * import { Pimlico } from "permissionless/pimlico"
 *
 * const client = Client.create({
 *     transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await Pimlico.validateSponsorshipPolicies(client, {
 *     userOperation,
 *     entryPointAddress: EntryPoint.addressV07,
 *     sponsorshipPolicyIds: ["sp_shiny_puma"]
 * })
 * // [{ sponsorshipPolicyId: "sp_shiny_puma", data: { name: "Shiny Puma", author: "Pimlico", icon: "data:image/png;base64,...", description: "..." } }]
 */
export const validateSponsorshipPolicies = async (
    client: Pick<Client.Client, "request">,
    args: ValidateSponsorshipPoliciesParameters
): Promise<ValidateSponsorshipPolicies[]> => {
    const request = client.request as Transport.RequestFn<PimlicoRpcSchema>
    return await request({
        method: "pm_validateSponsorshipPolicies",
        params: [
            deepHexlify(args.userOperation),
            args.entryPointAddress,
            args.sponsorshipPolicyIds
        ]
    })
}
