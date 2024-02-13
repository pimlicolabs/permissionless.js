import type { EntryPoint, GetEntryPointVersion, UserOperation } from "../types"
import { ENTRYPOINT_ADDRESS_V06 } from "./getEntryPointVersion"

export type GetRequiredPrefundReturnType<entryPoint extends EntryPoint> = {
    userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    entryPoint: entryPoint
}

/**
 *
 * Returns the minimum required funds in the senders's smart account to execute the user operation.
 *
 * @param arags: {userOperation} as {@link UserOperation}
 * @returns requiredPrefund as {@link bigint}
 *
 * @example
 * import { getRequiredPrefund } from "permissionless/utils"
 *
 * const requiredPrefund = getRequiredPrefund({
 *     userOperation
 * })
 */
export const getRequiredPrefund = <entryPoint extends EntryPoint>({
    userOperation,
    entryPoint: entryPointAddress
}: GetRequiredPrefundReturnType<entryPoint>): bigint => {
    if (entryPointAddress === ENTRYPOINT_ADDRESS_V06) {
        const userOperationVersion0_6 = userOperation as UserOperation<"0.6">
        const multiplier =
            userOperationVersion0_6.paymasterAndData.length > 2 ? 3n : 1n
        const requiredGas =
            userOperationVersion0_6.callGasLimit +
            userOperationVersion0_6.verificationGasLimit * multiplier +
            userOperationVersion0_6.preVerificationGas

        return (
            BigInt(requiredGas) * BigInt(userOperationVersion0_6.maxFeePerGas)
        )
    }

    const userOperationVersion0_7 = userOperation as UserOperation<"0.7">
    const multiplier = userOperationVersion0_7.paymaster ? 3n : 1n

    const verificationGasLimit =
        userOperationVersion0_7.verificationGasLimit +
        (userOperationVersion0_7.paymasterPostOpGasLimit || 0n) +
        (userOperationVersion0_7.paymasterVerificationGasLimit || 0n)

    const requiredGas =
        userOperationVersion0_7.callGasLimit +
        verificationGasLimit * multiplier +
        userOperationVersion0_7.preVerificationGas

    return BigInt(requiredGas) * BigInt(userOperationVersion0_7.maxFeePerGas)
}
