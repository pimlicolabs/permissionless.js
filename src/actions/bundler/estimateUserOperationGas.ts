import type { Address } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { BundlerClient } from "../../clients/bundler.js"
import type { UserOperation } from "../../types/userOperation.js"
import type { UserOperationWithBigIntAsHex } from "../../types/userOperation.js"
import { deepHexlify } from "../../utils/deepHexlify.js"

export type EstimateUserOperationGasParameters = {
    userOperation: PartialBy<UserOperation, "callGasLimit" | "preVerificationGas" | "verificationGasLimit">
    entryPoint: Address
}

export type EstimateUserOperationGasReturnType = {
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

/**
 * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/estimateUserOperationGas
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link EstimateUserOperationGasParameters}
 * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link EstimateUserOperationGasReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { estimateUserOperationGas } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const gasParameters = estimateUserOperationGas(bundlerClient, {
 *      serOperation: signedUserOperation,
 *      entryPoint: entryPoint
 * })
 *
 * // Return {preVerificationGas: 43492n, verificationGasLimit: 59436n, callGasLimit: 9000n}
 *
 */
export const estimateUserOperationGas = async (
    client: BundlerClient,
    args: EstimateUserOperationGasParameters
): Promise<EstimateUserOperationGasReturnType> => {
    const { userOperation, entryPoint } = args

    const response = await client.request({
        method: "eth_estimateUserOperationGas",
        params: [deepHexlify(userOperation) as UserOperationWithBigIntAsHex, entryPoint as Address]
    })

    return {
        preVerificationGas: BigInt(response.preVerificationGas || 0),
        verificationGasLimit: BigInt(response.verificationGasLimit || 0),
        callGasLimit: BigInt(response.callGasLimit || 0)
    }
}
