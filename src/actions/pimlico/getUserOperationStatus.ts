import type { Account, Chain, Client, Hash, Transport } from "viem"
import type { PimlicoBundlerClient } from "../../clients/pimlico.js"
import type { PimlicoBundlerRpcSchema, PimlicoUserOperationStatus } from "../../types/pimlico.js"

export type GetUserOperationStatusParameters = {
    hash: Hash
}

export type GetUserOperationStatusReturnType = PimlicoUserOperationStatus

/**
 * Returns the status of the userOperation that is pending in the mempool.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationStatus
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
 * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationStatus } from "permissionless/actions/pimlico"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await getUserOperationStatus(bundlerClient, { hash: userOpHash })
 *
 */
export const getUserOperationStatus = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, PimlicoBundlerRpcSchema>,
    { hash }: GetUserOperationStatusParameters
): Promise<GetUserOperationStatusReturnType> => {
    return client.request({
        method: "pimlico_getUserOperationStatus",
        params: [hash]
    })
}
