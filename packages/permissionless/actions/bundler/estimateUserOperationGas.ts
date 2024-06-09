import type { Account, BaseError, Chain, Client, Hex, Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { BundlerClient } from "../../clients/createBundlerClient"
import type { Prettify } from "../../types/"
import type { BundlerRpcSchema, StateOverrides } from "../../types/bundler"
import type { EntryPoint, GetEntryPointVersion } from "../../types/entrypoint"
import type { UserOperation } from "../../types/userOperation"
import { getEntryPointVersion } from "../../utils"
import { deepHexlify } from "../../utils/deepHexlify"
import {
    type GetEstimateUserOperationGasErrorReturnType,
    getEstimateUserOperationGasError
} from "../../utils/errors/getEstimateUserOperationGasError"

export type EstimateUserOperationGasParameters<entryPoint extends EntryPoint> =
    {
        userOperation: GetEntryPointVersion<entryPoint> extends "v0.6"
            ? PartialBy<
                  UserOperation<"v0.6">,
                  "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
              >
            : PartialBy<
                  UserOperation<"v0.7">,
                  | "callGasLimit"
                  | "preVerificationGas"
                  | "verificationGasLimit"
                  | "paymasterVerificationGasLimit"
                  | "paymasterPostOpGasLimit"
              >
        entryPoint: entryPoint
    }

export type EstimateUserOperationGasReturnType<entryPoint extends EntryPoint> =
    GetEntryPointVersion<entryPoint> extends "v0.6"
        ? {
              preVerificationGas: bigint
              verificationGasLimit: bigint
              callGasLimit: bigint
          }
        : {
              preVerificationGas: bigint
              verificationGasLimit: bigint
              callGasLimit: bigint
              paymasterVerificationGasLimit?: bigint
              paymasterPostOpGasLimit?: bigint
          }

export type EstimateUserOperationErrorType<entryPoint extends EntryPoint> =
    GetEstimateUserOperationGasErrorReturnType<entryPoint>

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
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema<entryPoint>>,
    args: Prettify<EstimateUserOperationGasParameters<entryPoint>>,
    stateOverrides?: StateOverrides
): Promise<EstimateUserOperationGasReturnType<entryPoint>> => {
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

        const entryPointVersion = getEntryPointVersion(entryPoint)

        if (entryPointVersion === "v0.6") {
            const responseV06 = response as {
                preVerificationGas: Hex
                verificationGasLimit: Hex
                callGasLimit: Hex
            }

            return {
                preVerificationGas: BigInt(responseV06.preVerificationGas || 0),
                verificationGasLimit: BigInt(
                    responseV06.verificationGasLimit || 0
                ),
                callGasLimit: BigInt(responseV06.callGasLimit || 0)
            } as EstimateUserOperationGasReturnType<entryPoint>
        }

        const responseV07 = response as {
            preVerificationGas: Hex
            verificationGasLimit: Hex
            callGasLimit: Hex
            paymasterVerificationGasLimit?: Hex
            paymasterPostOpGasLimit?: Hex
        }

        return {
            preVerificationGas: BigInt(responseV07.preVerificationGas || 0),
            verificationGasLimit: BigInt(responseV07.verificationGasLimit || 0),
            callGasLimit: BigInt(responseV07.callGasLimit || 0),
            paymasterVerificationGasLimit:
                responseV07.paymasterVerificationGasLimit
                    ? BigInt(responseV07.paymasterVerificationGasLimit)
                    : undefined,
            paymasterPostOpGasLimit: responseV07.paymasterPostOpGasLimit
                ? BigInt(responseV07.paymasterPostOpGasLimit)
                : undefined
        } as EstimateUserOperationGasReturnType<entryPoint>
    } catch (err) {
        throw getEstimateUserOperationGasError(err as BaseError, args)
    }
}
