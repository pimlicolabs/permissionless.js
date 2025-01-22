import { type Address, type Hex, encodeFunctionData } from "viem"
import {
    type UserOperation,
    entryPoint06Abi,
    toPackedUserOperation
} from "viem/account-abstraction"

function getPimlicoEstimationCallData06({
    userOperation,
    entrypoint
}: {
    userOperation: UserOperation<"0.6">
    entrypoint: {
        address: Address
        version: "0.6"
    }
}): { to: Address; data: Hex } {
    return {
        to: entrypoint.address,
        data: encodeFunctionData({
            abi: entryPoint06Abi,
            functionName: "simulateHandleOp",
            args: [
                {
                    callData: userOperation.callData,
                    callGasLimit: userOperation.callGasLimit,
                    initCode: userOperation.initCode ?? "0x",
                    maxFeePerGas: userOperation.maxFeePerGas,
                    maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
                    nonce: userOperation.nonce,
                    paymasterAndData: userOperation.paymasterAndData ?? "0x",
                    preVerificationGas: userOperation.preVerificationGas,
                    sender: userOperation.sender,
                    signature: userOperation.signature,
                    verificationGasLimit: userOperation.verificationGasLimit
                },
                "0x",
                "0x"
            ]
        })
    }
}

function encodeSimulateHandleOpLast({
    userOperation
}: {
    userOperation: UserOperation<"0.7">
}): Hex {
    const userOperations = [userOperation]
    const packedUserOperations = userOperations.map((uop) => ({
        packedUserOperation: toPackedUserOperation(uop)
    }))

    const simulateHandleOpCallData = encodeFunctionData({
        abi: [
            {
                type: "function",
                name: "simulateHandleOpLast",
                inputs: [
                    {
                        name: "ops",
                        type: "tuple[]",
                        internalType: "struct PackedUserOperation[]",
                        components: [
                            {
                                name: "sender",
                                type: "address",
                                internalType: "address"
                            },
                            {
                                name: "nonce",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "initCode",
                                type: "bytes",
                                internalType: "bytes"
                            },
                            {
                                name: "callData",
                                type: "bytes",
                                internalType: "bytes"
                            },
                            {
                                name: "accountGasLimits",
                                type: "bytes32",
                                internalType: "bytes32"
                            },
                            {
                                name: "preVerificationGas",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "gasFees",
                                type: "bytes32",
                                internalType: "bytes32"
                            },
                            {
                                name: "paymasterAndData",
                                type: "bytes",
                                internalType: "bytes"
                            },
                            {
                                name: "signature",
                                type: "bytes",
                                internalType: "bytes"
                            }
                        ]
                    }
                ],
                outputs: [
                    {
                        name: "",
                        type: "tuple",
                        internalType:
                            "struct IEntryPointSimulations.ExecutionResult",
                        components: [
                            {
                                name: "preOpGas",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "paid",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "accountValidationData",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "paymasterValidationData",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "paymasterVerificationGasLimit",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "paymasterPostOpGasLimit",
                                type: "uint256",
                                internalType: "uint256"
                            },
                            {
                                name: "targetSuccess",
                                type: "bool",
                                internalType: "bool"
                            },
                            {
                                name: "targetResult",
                                type: "bytes",
                                internalType: "bytes"
                            }
                        ]
                    }
                ],
                stateMutability: "nonpayable"
            }
        ],
        functionName: "simulateHandleOpLast",
        args: [packedUserOperations.map((uop) => uop.packedUserOperation)]
    })

    return simulateHandleOpCallData
}

const PIMLICO_ESTIMATION_ADDRESS = "0x949CeCa936909f75E5A40bD285d9985eFBb9B0D3"

function getPimlicoEstimationCallData07({
    userOperation,
    estimationAddress,
    entrypoint
}: {
    userOperation: UserOperation<"0.7">
    estimationAddress?: Address
    entrypoint: {
        address: Address
        version: "0.7"
    }
}): { to: Address; data: Hex } {
    const simulateHandleOpLast = encodeSimulateHandleOpLast({
        userOperation
    })

    return {
        to: estimationAddress ?? PIMLICO_ESTIMATION_ADDRESS,
        data: encodeFunctionData({
            abi: [
                {
                    inputs: [
                        {
                            internalType: "address payable",
                            name: "ep",
                            type: "address"
                        },
                        {
                            internalType: "bytes[]",
                            name: "data",
                            type: "bytes[]"
                        }
                    ],
                    name: "simulateEntryPoint",
                    outputs: [
                        {
                            internalType: "bytes[]",
                            name: "",
                            type: "bytes[]"
                        }
                    ],
                    stateMutability: "nonpayable",
                    type: "function"
                }
            ],
            functionName: "simulateEntryPoint",
            args: [entrypoint.address, [simulateHandleOpLast]]
        })
    }
}

export type GetPimlicoEstimationCallDataParams<
    entryPointVersion extends "0.6" | "0.7"
> = {
    userOperation: UserOperation<entryPointVersion>
    entrypoint: {
        address: Address
        version: entryPointVersion
    }
} & (entryPointVersion extends "0.6"
    ? {
          estimationAddress: never
      }
    : { estimationAddress?: Address })

function isEntryPoint06(
    args: GetPimlicoEstimationCallDataParams<"0.6" | "0.7">
): args is GetPimlicoEstimationCallDataParams<"0.6"> {
    return args.entrypoint.version === "0.6"
}

function isEntryPoint07(
    args: GetPimlicoEstimationCallDataParams<"0.6" | "0.7">
): args is GetPimlicoEstimationCallDataParams<"0.7"> {
    return args.entrypoint.version === "0.7"
}

export function getPimlicoEstimationCallData<
    entryPointVersion extends "0.6" | "0.7"
>(
    args: GetPimlicoEstimationCallDataParams<entryPointVersion>
): { to: Address; data: Hex } {
    if (isEntryPoint06(args)) {
        return getPimlicoEstimationCallData06({
            userOperation: args.userOperation,
            entrypoint: {
                address: args.entrypoint.address,
                version: "0.6"
            }
        })
    }

    if (isEntryPoint07(args)) {
        return getPimlicoEstimationCallData07({
            userOperation: args.userOperation,
            estimationAddress: args.estimationAddress,
            entrypoint: {
                address: args.entrypoint.address,
                version: "0.7"
            }
        })
    }

    throw new Error("Invalid entrypoint version")
}
