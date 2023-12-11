import type { UserOperation } from "../types"

export type GetRequiredPreFundReturnType = {
    userOperation: UserOperation
}

/**
 *
 * Returns the minimum required funds in the senders's smart account to execute the user operation.
 *
 * @param arags: {userOperation} as {@link UserOperation}
 * @returns requiredPreFund as {@link bigint}
 *
 * @example
 * import { getRequiredPreFund } from "permissionless/utils"
 *
 * const requiredPreFund = getRequiredPreFund({
 *     userOperation
 * })
 */
export const getRequiredPreFund = ({
    userOperation
}: GetRequiredPreFundReturnType): bigint => {
    const multiplier = userOperation.paymasterAndData.length > 2 ? 2n : 1n
    const requiredGas =
        userOperation.callGasLimit +
        userOperation.verificationGasLimit * multiplier +
        userOperation.preVerificationGas

    return BigInt(requiredGas) * BigInt(userOperation.maxFeePerGas)
}
