import {
    BaseError,
    type Account,
    type Address,
    type Chain,
    type Client,
    type Transport,
    UnknownNodeError
} from "viem"
import type { PartialBy } from "viem/types/utils"
import type { BundlerClient } from "../../clients/createBundlerClient.js"
import type { BundlerRpcSchema, StateOverrides } from "../../types/bundler.js"
import type { Prettify } from "../../types/index.js"
import type { UserOperation } from "../../types/userOperation.js"
import { deepHexlify } from "../../utils/deepHexlify.js"
import { EstimateUserOperationGasExecutionError } from "../../errors/EstimateGasExecutionError.js"
import { getEstimateUserOperationGasError } from "../../utils/errors/getEstimateUserOperationGasError.js"

export type EstimateUserOperationGasParameters = {
    userOperation: PartialBy<
        UserOperation,
        "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
    >
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
export const estimateUserOperationGas = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
    args: Prettify<EstimateUserOperationGasParameters>,
    stateOverrides?: StateOverrides
): Promise<Prettify<EstimateUserOperationGasReturnType>> => {
    const { userOperation, entryPoint } = args

    const userOperationWithBigIntAsHex = deepHexlify(userOperation)
    const stateOverridesWithBigIntAsHex = deepHexlify(stateOverrides)

    try {
        const response = await client.request({
            method: "eth_estimateUserOperationGas",
            params: stateOverrides
                ? [
                      userOperationWithBigIntAsHex,
                      entryPoint,
                      stateOverridesWithBigIntAsHex
                  ]
                : [userOperationWithBigIntAsHex, entryPoint]
        })

        return {
            preVerificationGas: BigInt(response.preVerificationGas || 0),
            verificationGasLimit: BigInt(response.verificationGasLimit || 0),
            callGasLimit: BigInt(response.callGasLimit || 0)
        }
    } catch (err) {
        console.log(err)
        const cause = (() => {
            const cause = getEstimateUserOperationGasError(
                err as BaseError,
                args as EstimateUserOperationGasParameters
            )
            if (cause instanceof UnknownNodeError) return err as BaseError
            return cause
        })()

        throw new EstimateUserOperationGasExecutionError(cause, {
            ...args
        })
    }
}
