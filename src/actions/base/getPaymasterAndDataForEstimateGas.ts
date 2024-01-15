import type { Address, Hash, Hex } from "viem"
import { BasePaymasterClient } from "../../clients/base.js"
import { type UserOperationWithBigIntAsHex } from "../../types/userOperation.js"

export type GetPaymasterAndDataForEstimateGasParameters = {
    userOperation: UserOperationWithBigIntAsHex
    entryPoint: Address
    chainId: Hex
}

export type GetPaymasterAndDataForEstimateGasReturnType = Hash

/**
 * Returns paymasterAndData for gas estimation. Note that this is a dummy signature that won't be accepted by the paymaster, except for gas estimation.
 *
 * @param client {@link BasePaymasterClient} that you created using viem's createClient whose transport url is pointing to the Base paymaster.
 * @param args {@link GetPaymasterAndDataForEstimateGasParameters} UserOperation you want to sponsor, entryPoint, and chain ID.
 * @returns paymasterAndData with a dummy signature just for gas estimation.
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getPaymasterAndDataForEstimateGas } from "permissionless/actions/base"
 *
 * const paymasterClient = createClient({
 *      transport: http("https://paymaster.base.org")
 * })
 *
 * await getPaymasterAndDataForEstimateGas(bundlerClient, {
 *      userOperation: userOperationWithoutPaymaster,
 *      entryPoint: entryPoint,
 *      chainId: toHex(chainId)
 * }})
 *
 */
export const getPaymasterAndDataForEstimateGas = async (
    client: BasePaymasterClient,
    args: GetPaymasterAndDataForEstimateGasParameters
): Promise<GetPaymasterAndDataForEstimateGasReturnType> => {
    const response = await client.request({
        method: "eth_paymasterAndDataForEstimateGas",
        params: [args.userOperation, args.entryPoint, args.chainId]
    })

    return response
}
