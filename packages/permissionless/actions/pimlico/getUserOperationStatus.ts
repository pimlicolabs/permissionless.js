import type { Client, Transport } from "viem"
import type { Hex } from "viem/utils"
import type {
    PimlicoRpcSchema,
    PimlicoUserOperationStatus
} from "../../types/pimlico.js"

export type GetUserOperationStatusParameters = {
    hash: Hex.Hex
}

export type GetUserOperationStatusReturnType = PimlicoUserOperationStatus

/**
 * Returns the status of the userOperation that is pending in the mempool.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationStatus
 *
 * @param client viem client whose transport points at Pimlico's RPC.
 * @param hash {@link Hash} UserOpHash that you must have received from sendUserOperation.
 * @returns status & transaction hash if included {@link GetUserOperationStatusReturnType}
 *
 *
 * @example
 * import { Client, http } from "viem"
 * import { Pimlico } from "permissionless/pimlico"
 *
 * const client = Client.create({
 *     transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await Pimlico.getUserOperationStatus(client, { hash: userOpHash })
 */
export const getUserOperationStatus = async (
    client: Pick<Client.Client, "request">,
    { hash }: GetUserOperationStatusParameters
): Promise<GetUserOperationStatusReturnType> => {
    const request = client.request as Transport.RequestFn<PimlicoRpcSchema>
    return request({
        method: "pimlico_getUserOperationStatus",
        params: [hash]
    })
}
