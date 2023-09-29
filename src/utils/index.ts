import { type Address, type Hex, encodeAbiParameters, keccak256 } from "viem"
import type { UserOperation } from "../types"

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

const getUserOperationHash = ({
    userOperation,
    entryPoint,
    chainId
}: { userOperation: UserOperation; entryPoint: Address; chainId: bigint }) => {
    const encoded = encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
        [keccak256(packUserOp({ userOperation })), entryPoint, chainId]
    ) as `0x${string}`

    return keccak256(encoded)
}

export { getUserOperationHash }
