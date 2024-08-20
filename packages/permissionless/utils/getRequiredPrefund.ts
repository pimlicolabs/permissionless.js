import type { UserOperation } from "viem/account-abstraction"

export type GetRequiredPrefundReturnType<
    entryPointVersion extends "0.6" | "0.7"
> = {
    userOperation: UserOperation<entryPointVersion>
    entryPointVersion: entryPointVersion
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
export const getRequiredPrefund = <entryPointVersion extends "0.6" | "0.7">({
    userOperation,
    entryPointVersion
}: GetRequiredPrefundReturnType<entryPointVersion>): bigint => {
    if (entryPointVersion === "0.6") {
        const userOperationVersion0_6 = userOperation as UserOperation<"0.6">
        const multiplier =
            (userOperationVersion0_6.paymasterAndData?.length ?? 0) > 2
                ? BigInt(3)
                : BigInt(1)
        const requiredGas =
            userOperationVersion0_6.callGasLimit +
            userOperationVersion0_6.verificationGasLimit * multiplier +
            userOperationVersion0_6.preVerificationGas

        return (
            BigInt(requiredGas) * BigInt(userOperationVersion0_6.maxFeePerGas)
        )
    }

    const userOperationV07 = userOperation as UserOperation<"0.7">
    const multiplier = userOperationV07.paymaster ? BigInt(3) : BigInt(1)

    const verificationGasLimit =
        userOperationV07.verificationGasLimit +
        (userOperationV07.paymasterPostOpGasLimit || BigInt(0)) +
        (userOperationV07.paymasterVerificationGasLimit || BigInt(0))

    const requiredGas =
        userOperationV07.callGasLimit +
        verificationGasLimit * multiplier +
        userOperationV07.preVerificationGas

    return BigInt(requiredGas) * BigInt(userOperationV07.maxFeePerGas)
}
