import type { Client, Hash } from "viem"
import type { PimlicoBundlerClient, PimlicoUserOperationGasPrice, PimlicoUserOperationStatus } from "../types/pimlico"

/**
 * Returns the live gas prices that you can use to send a user operation.
 *
 * - Docs: [TODO://add link]
 * - Example: [TODO://add link]
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * await getUserOperationGasPrice(bundlerClient)
 *
 */
const getUserOperationGasPrice = async (client: PimlicoBundlerClient): Promise<PimlicoUserOperationGasPrice> => {
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
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
 * @returns status & transaction hash if included {@link PimlicoUserOperationStatus}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * await getUserOperationStatus(bundlerClient, userOpHash)
 *
 */
const getUserOperationStatus = async (client: PimlicoBundlerClient, hash: Hash) => {
    return client.request({
        method: "pimlico_getUserOperationStatus",
        params: [hash]
    })
}

export const pimlicoBundlerActions = (client: Client) => ({
    /**
     * Returns the live gas prices that you can use to send a user operation.
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas {@link PimlicoUserOperationGasPrice}
     *
     * @example
     *
     * import { createClient } from "viem"
     * import { sendUserOperation } from "permissionless/actions"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(pimlicoActions || pimlicoBundlerActions)
     *
     * await bundlerClient.getUserOperationGasPrice()
     */
    getUserOperationGasPrice: async () => getUserOperationGasPrice(client as PimlicoBundlerClient),

    /**
     * Returns the status of the userOperation that is pending in the mempool.
     *
     * - Docs: [TODO://add link]
     * - Example: [TODO://add link]
     *
     * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
     * @returns status & transaction hash if included {@link PimlicoUserOperationStatus}
     *
     * @example
     * import { createClient } from "viem"
     * import { sendUserOperation } from "permissionless/actions"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(pimlicoActions || pimlicoBundlerActions)
     *
     * await bundlerClient.getUserOperationStatus(userOpHash)
     */
    getUserOperationStatus: async (hash: Hash) => getUserOperationStatus(client as PimlicoBundlerClient, hash)
})

// export const pimlicoPaymasterActions = (client: Client) => ({})

export const pimlicoActions = (client: Client) => {
    return {
        ...pimlicoBundlerActions(client)
        // ...pimlicoPaymasterActions(client)
    }
}
