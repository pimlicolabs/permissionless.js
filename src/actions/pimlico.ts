import type { Address, Client, Hash, Hex } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { PimlicoBundlerClient, PimlicoPaymasterClient } from "../clients/pimlico"
import type { PimlicoUserOperationStatus } from "../types/pimlico"
import type { UserOperation, UserOperationWithBigIntAsHex } from "../types/userOperation"
import { deepHexlify } from "./utils"

export type SponsorUserOperationParameters = {
    userOperation: PartialBy<
        UserOperation,
        "callGasLimit" | "preVerificationGas" | "verificationGasLimit" | "paymasterAndData"
    >
    entryPoint: Address
}

export type SponsorUserOperationReturnType = {
    paymasterAndData: Hex
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

export type GetUserOperationGasPriceReturnType = {
    slow: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
    standard: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
    fast: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
}

export type GetUserOperationStatusParameters = {
    hash: Hash
}

export type GetUserOperationStatusReturnType = PimlicoUserOperationStatus

/**
 * Returns the live gas prices that you can use to send a user operation.
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationGasPrice } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await getUserOperationGasPrice(bundlerClient)
 *
 */
export const getUserOperationGasPrice = async (
    client: PimlicoBundlerClient
): Promise<GetUserOperationGasPriceReturnType> => {
    const gasPrices = await client.request({
        method: "pimlico_getUserOperationGasPrice",
        params: []
    })

    return {
        slow: {
            maxFeePerGas: BigInt(gasPrices.slow.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.slow.maxPriorityFeePerGas)
        },
        standard: {
            maxFeePerGas: BigInt(gasPrices.standard.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.standard.maxPriorityFeePerGas)
        },
        fast: {
            maxFeePerGas: BigInt(gasPrices.fast.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasPrices.fast.maxPriorityFeePerGas)
        }
    }
}

/**
 * Returns the status of the userOperation that is pending in the mempool.
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
 * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationStatus } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await getUserOperationStatus(bundlerClient, { hash: userOpHash })
 *
 */
export const getUserOperationStatus = async (
    client: PimlicoBundlerClient,
    { hash }: GetUserOperationStatusParameters
): Promise<GetUserOperationStatusReturnType> => {
    return client.request({
        method: "pimlico_getUserOperationStatus",
        params: [hash]
    })
}

export type PimlicoBundlerActions = {
    /**
     * Returns the live gas prices that you can use to send a user operation.
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas {@link GetUserOperationGasPriceReturnType}
     *
     * @example
     *
     * import { createClient } from "viem"
     * import { pimlicoBundlerActions } from "permissionless/actions"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(pimlicoBundlerActions)
     *
     * await bundlerClient.getUserOperationGasPrice()
     */
    getUserOperationGasPrice: () => Promise<GetUserOperationGasPriceReturnType>
    /**
     * Returns the status of the userOperation that is pending in the mempool.
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
     * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { pimlicoBundlerActions } from "permissionless/actions"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(pimlicoBundlerActions)
     *
     * await bundlerClient.getUserOperationStatus({ hash: userOpHash })
     */
    getUserOperationStatus: (args: GetUserOperationStatusParameters) => Promise<GetUserOperationStatusReturnType>
}

export const pimlicoBundlerActions = (client: Client): PimlicoBundlerActions => ({
    getUserOperationGasPrice: async () => getUserOperationGasPrice(client as PimlicoBundlerClient),
    getUserOperationStatus: async (args: GetUserOperationStatusParameters) =>
        getUserOperationStatus(client as PimlicoBundlerClient, args)
})

/**
 * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param args {@link sponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
 * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sponsorUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await sponsorUserOperation(bundlerClient, {
 *      userOperation: userOperationWithDummySignature,
 *      entryPoint: entryPoint
 * }})
 *
 */
export const sponsorUserOperation = async (
    client: PimlicoPaymasterClient,
    args: SponsorUserOperationParameters
): Promise<SponsorUserOperationReturnType> => {
    const response = await client.request({
        method: "pm_sponsorUserOperation",
        params: [deepHexlify(args.userOperation) as UserOperationWithBigIntAsHex, args.entryPoint]
    })

    return {
        paymasterAndData: response.paymasterAndData,
        preVerificationGas: BigInt(response.preVerificationGas),
        verificationGasLimit: BigInt(response.verificationGasLimit),
        callGasLimit: BigInt(response.callGasLimit)
    }
}

export type PimlicoPaymasterClientActions = {
    /**
     * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param args {@link SponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
     * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { sponsorUserOperation } from "permissionless/actions"
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
    sponsorUserOperation: (args: SponsorUserOperationParameters) => Promise<SponsorUserOperationReturnType>
}

export const pimlicoPaymasterActions = (client: Client): PimlicoPaymasterClientActions => ({
    sponsorUserOperation: async (args: SponsorUserOperationParameters) =>
        sponsorUserOperation(client as PimlicoPaymasterClient, args)
})

/**
 * TODO: Add support for pimlicoActions after we support all the actions of v1 in v2 of the Pimlico API.
 */
// export const pimlicoActions = (client: Client) => {
//     return {
//         ...pimlicoBundlerActions(client),
//         ...pimlicoPaymasterActions(client)
//     }
// }
