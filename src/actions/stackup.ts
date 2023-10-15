import type { Address, Client, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import { type StackupPaymasterClient } from "../clients/stackup"
import type { UserOperation } from "../types"
import type { StackupPaymasterContext } from "../types/stackup"
import { type UserOperationWithBigIntAsHex } from "../types/userOperation"
import { deepHexlify } from "./utils"

export type SponsorUserOperationParameters = {
    userOperation: PartialBy<
        UserOperation,
        "callGasLimit" | "preVerificationGas" | "verificationGasLimit" | "paymasterAndData"
    >
    entryPoint: Address
    context: StackupPaymasterContext
}

export type SponsorUserOperationReturnType = {
    paymasterAndData: Hex
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

export type AccountsParameters = {
    entryPoint: Address
}

/**
 * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/stackup-paymaster-actions/sponsorUserOperation
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param args {@link sponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
 * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sponsorUserOperation } from "permissionless/actions/stackup"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.stackup.sh/v1/paymaster/YOUR_API_KEY_HERE")
 * })
 *
 * await sponsorUserOperation(bundlerClient, {
 *      userOperation: userOperationWithDummySignature,
 *      entryPoint: entryPoint
 * }})
 *
 */
export const sponsorUserOperation = async (
    client: StackupPaymasterClient,
    args: SponsorUserOperationParameters
): Promise<SponsorUserOperationReturnType> => {
    const response = await client.request({
        method: "pm_sponsorUserOperation",
        params: [deepHexlify(args.userOperation) as UserOperationWithBigIntAsHex, args.entryPoint, args.context]
    })

    return {
        paymasterAndData: response.paymasterAndData,
        preVerificationGas: BigInt(response.preVerificationGas),
        verificationGasLimit: BigInt(response.verificationGasLimit),
        callGasLimit: BigInt(response.callGasLimit)
    }
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
    sponsorUserOperation: (args: SponsorUserOperationParameters) => Promise<SponsorUserOperationReturnType>

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

export const stackupPaymasterActions = (client: Client): StackupPaymasterClientActions => ({
    sponsorUserOperation: async (args: SponsorUserOperationParameters) =>
        sponsorUserOperation(client as StackupPaymasterClient, args),
    accounts: async (args: AccountsParameters) => accounts(client as StackupPaymasterClient, args)
})
