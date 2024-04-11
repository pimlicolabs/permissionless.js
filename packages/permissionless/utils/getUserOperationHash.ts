import type { Address, Hash, Hex } from "viem"
import { concat, encodeAbiParameters, keccak256, pad, toHex } from "viem"
import type { EntryPoint, GetEntryPointVersion } from "../types"
import type { UserOperation } from "../types/userOperation"
import { isUserOperationVersion06 } from "./getEntryPointVersion"

function packUserOp<entryPoint extends EntryPoint>({
    userOperation,
    entryPoint: entryPointAddress
}: {
    userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    entryPoint: entryPoint
}): Hex {
    if (isUserOperationVersion06(entryPointAddress, userOperation)) {
        const hashedInitCode = keccak256(userOperation.initCode)
        const hashedCallData = keccak256(userOperation.callData)
        const hashedPaymasterAndData = keccak256(userOperation.paymasterAndData)

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
                userOperation.sender as Address,
                userOperation.nonce,
                hashedInitCode,
                hashedCallData,
                userOperation.callGasLimit,
                userOperation.verificationGasLimit,
                userOperation.preVerificationGas,
                userOperation.maxFeePerGas,
                userOperation.maxPriorityFeePerGas,
                hashedPaymasterAndData
            ]
        )
    }

    const hashedInitCode = keccak256(
        userOperation.factory && userOperation.factoryData
            ? concat([userOperation.factory, userOperation.factoryData])
            : "0x"
    )
    const hashedCallData = keccak256(userOperation.callData)
    const hashedPaymasterAndData = keccak256(
        userOperation.paymaster
            ? concat([
                  userOperation.paymaster,
                  pad(
                      toHex(
                          userOperation.paymasterVerificationGasLimit ||
                              BigInt(0)
                      ),
                      {
                          size: 16
                      }
                  ),
                  pad(
                      toHex(userOperation.paymasterPostOpGasLimit || BigInt(0)),
                      {
                          size: 16
                      }
                  ),
                  userOperation.paymasterData || "0x"
              ])
            : "0x"
    )

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
            userOperation.sender as Address,
            userOperation.nonce,
            hashedInitCode,
            hashedCallData,
            concat([
                pad(toHex(userOperation.verificationGasLimit), {
                    size: 16
                }),
                pad(toHex(userOperation.callGasLimit), { size: 16 })
            ]),
            userOperation.preVerificationGas,
            concat([
                pad(toHex(userOperation.maxPriorityFeePerGas), {
                    size: 16
                }),
                pad(toHex(userOperation.maxFeePerGas), { size: 16 })
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
