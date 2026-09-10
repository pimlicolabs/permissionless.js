import type { UserOperation } from "viem/erc4337"
import { AbiParameters, type Address, Hash, type Hex } from "viem/utils"

export function packUserOperation06(
    userOperation: UserOperation.UserOperation<"0.6">
): Hex.Hex {
    const {
        sender,
        nonce,
        initCode = "0x",
        callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndData = "0x"
    } = userOperation
    return AbiParameters.encode(
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
            sender,
            nonce,
            Hash.keccak256(initCode),
            Hash.keccak256(callData),
            callGasLimit,
            verificationGasLimit,
            preVerificationGas,
            maxFeePerGas,
            maxPriorityFeePerGas,
            Hash.keccak256(paymasterAndData)
        ]
    )
}

export function getUserOperationHash06(
    userOperation: UserOperation.UserOperation<"0.6">,
    {
        chainId,
        entryPointAddress
    }: { chainId: number; entryPointAddress: Address.Address }
): Hex.Hex {
    return Hash.keccak256(
        AbiParameters.encode(
            [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
            [
                Hash.keccak256(packUserOperation06(userOperation)),
                entryPointAddress,
                BigInt(chainId)
            ]
        )
    )
}
