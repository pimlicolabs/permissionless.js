import type { EntryPoint, UserOperation } from "viem/erc4337"

export type GetRequiredPrefundParameters<
    entryPointVersion extends EntryPoint.Version = "0.7"
> = {
    userOperation: UserOperation.UserOperation<entryPointVersion>
    entryPointVersion: entryPointVersion
}

export type GetRequiredPrefundReturnType = bigint

/**
 * Returns the minimum required funds in the sender's smart account to execute the user operation.
 *
 * @param parameters {@link GetRequiredPrefundParameters}
 * @returns requiredPrefund {@link GetRequiredPrefundReturnType}
 *
 * @example
 * import { getRequiredPrefund } from "permissionless"
 *
 * const requiredPrefund = getRequiredPrefund({
 *     userOperation,
 *     entryPointVersion: "0.7"
 * })
 */
export const getRequiredPrefund = <
    entryPointVersion extends EntryPoint.Version
>({
    userOperation,
    entryPointVersion
}: GetRequiredPrefundParameters<entryPointVersion>): GetRequiredPrefundReturnType => {
    if (entryPointVersion === "0.6") {
        const userOperationVersion0_6 =
            userOperation as UserOperation.UserOperation<"0.6">
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

    const userOperationV07 = userOperation as UserOperation.UserOperation<
        "0.7" | "0.8" | "0.9"
    >

    const requiredGas =
        userOperationV07.verificationGasLimit +
        userOperationV07.callGasLimit +
        (userOperationV07.paymasterVerificationGasLimit || 0n) +
        (userOperationV07.paymasterPostOpGasLimit || 0n) +
        userOperationV07.preVerificationGas

    return requiredGas * userOperationV07.maxFeePerGas
}
