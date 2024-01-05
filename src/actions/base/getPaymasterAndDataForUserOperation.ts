import type { Account, Address, Chain, Hash, Hex, Transport } from "viem"
import { BasePaymasterClient } from "../../clients/base.js"
import { type UserOperationWithBigIntAsHex } from "../../types/userOperation.js"

export type GetPaymasterAndDataForUserOperationParameters = {
    userOperation: UserOperationWithBigIntAsHex
    entryPoint: Address
    chainId: Hex
}

export type GetPaymasterAndDataForUserOperationReturnType = Hash

/**
 * Returns paymasterAndData for sponsoring a userOp.
 *
 * @param client {@link BasePaymasterClient} that you created using viem's createClient whose transport url is pointing to the Base paymaster.
 * @param args {@link GetPaymasterAndDataForUserOperationParameters} UserOperation you want to sponsor, entryPoint, and chain ID.
 * @returns paymasterAndData for sponsoring a userOp.
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getPaymasterAndDataForUserOperation } from "permissionless/actions/base"
 *
 * const paymasterClient = createClient({
 *      transport: http("https://paymaster.base.org")
 * })
 *
 * await getPaymasterAndDataForUserOperation(bundlerClient, {
 *      userOperation: userOperation,
 *      entryPoint: entryPoint,
 *      chainId: toHex(chainId)
 * }})
 *
 */
export const getPaymasterAndDataForUserOperation = async (
    client: BasePaymasterClient,
    args: GetPaymasterAndDataForUserOperationParameters
): Promise<GetPaymasterAndDataForUserOperationReturnType> => {
    const response = await client.request({
        method: "eth_paymasterAndDataForUserOperation",
        params: [args.userOperation, args.entryPoint, args.chainId]
    })

    return response
}
