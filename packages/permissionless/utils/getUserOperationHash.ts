import type { Address, Hash, Hex } from "viem"
import { concat, encodeAbiParameters, keccak256, pad, toHex } from "viem"
import type { EntryPoint, GetEntryPointVersion } from "../types"
import type { UserOperation } from "../types/userOperation"
import { getEntryPointVersion } from "./getEntryPointVersion"

function packUserOp<entryPoint extends EntryPoint>({
    userOperation,
    entryPoint: entryPointAddress
}: {
    userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    entryPoint: entryPoint
}): Hex {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    if (entryPointVersion === "0.6") {
        const userOperationVersion0_6 = userOperation as UserOperation<"0.6">
        const hashedInitCode = keccak256(userOperationVersion0_6.initCode)
        const hashedCallData = keccak256(userOperationVersion0_6.callData)
        const hashedPaymasterAndData = keccak256(
            userOperationVersion0_6.paymasterAndData
        )

        return encodeAbiParameters(
            [
                { type: "address" },
                { type: "uint256" },
                { type: "bytes32" },
                { type: "bytes32" },
                { type: "uint256" },
                { type: "uint256" },
                { type: "uint256" },
                { type: "uint256" },
                { type: "uint256" },
                { type: "bytes32" }
            ],
            [
                userOperationVersion0_6.sender as Address,
                userOperationVersion0_6.nonce,
                hashedInitCode,
                hashedCallData,
                userOperationVersion0_6.callGasLimit,
                userOperationVersion0_6.verificationGasLimit,
                userOperationVersion0_6.preVerificationGas,
                userOperationVersion0_6.maxFeePerGas,
                userOperationVersion0_6.maxPriorityFeePerGas,
                hashedPaymasterAndData
            ]
        )
    }

    const userOperationVersion0_7 = userOperation as UserOperation<"0.7">
    const hashedInitCode =
        userOperationVersion0_7.factory && userOperationVersion0_7.factoryData
            ? keccak256(
                  concat([
                      userOperationVersion0_7.factory,
                      userOperationVersion0_7.factoryData
                  ])
              )
            : "0x"
    const hashedCallData = keccak256(userOperationVersion0_7.callData)
    const hashedPaymasterAndData =
        userOperationVersion0_7.paymaster &&
        userOperationVersion0_7.paymasterVerificationGasLimit &&
        userOperationVersion0_7.paymasterPostOpGasLimit &&
        userOperationVersion0_7.paymasterData
            ? keccak256(
                  concat([
                      userOperationVersion0_7.paymaster,
                      pad(
                          toHex(
                              userOperationVersion0_7.paymasterVerificationGasLimit
                          ),
                          {
                              size: 16
                          }
                      ),
                      pad(
                          toHex(
                              userOperationVersion0_7.paymasterPostOpGasLimit
                          ),
                          {
                              size: 16
                          }
                      ),
                      userOperationVersion0_7.paymasterData
                  ])
              )
            : "0x"

    return encodeAbiParameters(
        [
            { type: "address" },
            { type: "uint256" },
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "uint256" },
            { type: "bytes32" },
            { type: "bytes32" }
        ],
        [
            userOperationVersion0_7.sender as Address,
            userOperationVersion0_7.nonce,
            hashedInitCode,
            hashedCallData,
            concat([
                pad(toHex(userOperationVersion0_7.verificationGasLimit), {
                    size: 16
                }),
                pad(toHex(userOperationVersion0_7.callGasLimit), { size: 16 })
            ]),
            userOperationVersion0_7.preVerificationGas,
            concat([
                pad(toHex(userOperationVersion0_7.maxPriorityFeePerGas), {
                    size: 16
                }),
                pad(toHex(userOperationVersion0_7.maxFeePerGas), { size: 16 })
            ]),
            hashedPaymasterAndData
        ]
    )
}

export type GetUserOperationHashParams<entryPoint extends EntryPoint> = {
    userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    entryPoint: entryPoint
    chainId: number
}

/**
 *
 * Returns user operation hash that is a unique identifier of the user operation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/utils/getUserOperationHash
 *
 * @param args: userOperation, entryPoint, chainId as {@link GetUserOperationHashParams}
 * @returns userOperationHash as {@link Hash}
 *
 * @example
 * import { getUserOperationHash } from "permissionless/utils"
 *
 * const userOperationHash = getUserOperationHash({
 *      userOperation,
 *      entryPoint,
 *      chainId
 * })
 *
 * // Returns "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"
 *
 */
export const getUserOperationHash = <entryPoint extends EntryPoint>({
    userOperation,
    entryPoint: entryPointAddress,
    chainId
}: GetUserOperationHashParams<entryPoint>): Hash => {
    const encoded = encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
        [
            keccak256(
                packUserOp<entryPoint>({
                    userOperation,
                    entryPoint: entryPointAddress
                })
            ),
            entryPointAddress,
            BigInt(chainId)
        ]
    ) as `0x${string}`

    return keccak256(encoded)
}
