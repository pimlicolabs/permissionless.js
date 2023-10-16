import type { Address, Hash, Hex } from "viem"
import { encodeAbiParameters, keccak256 } from "viem"
import type { UserOperation } from "../types/userOperation"

function packUserOp({ userOperation }: { userOperation: UserOperation }): Hex {
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

export type GetUserOperationHashParams = { userOperation: UserOperation; entryPoint: Address; chainId: number }

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
export const getUserOperationHash = ({ userOperation, entryPoint, chainId }: GetUserOperationHashParams): Hash => {
    const encoded = encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
        [keccak256(packUserOp({ userOperation })), entryPoint, BigInt(chainId)]
    ) as `0x${string}`

    return keccak256(encoded)
}
