import type { Account, Chain, Client, Hash, Transport } from "viem"
import type {
    PimlicoRpcSchema,
    PimlicoUserOperationStatus
} from "../../types/pimlico.js"

export type GetUserOperationStatusParameters = {
    hash: Hash
}

export type GetUserOperationStatusReturnType = PimlicoUserOperationStatus

/**
 * Returns the status of the userOperation that is pending in the mempool.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationStatus
 *
 * @param client {@link PimlicoClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
 * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationStatus } from "permissionless/actions/pimlico"
 * import { pimlicoBundlerActions } from 'permissionless/actions/pimlico'
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * }).extend(pimlicoBundlerActions)
 *
 * await getUserOperationStatus(bundlerClient, { hash: userOpHash })
 *
 */
export const getUserOperationStatus = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PimlicoRpcSchema
    >,
    { hash }: GetUserOperationStatusParameters
): Promise<GetUserOperationStatusReturnType> => {
    return client.request({
        method: "pimlico_getUserOperationStatus",
        params: [hash]
    })
}
