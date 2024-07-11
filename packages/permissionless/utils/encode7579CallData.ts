import {
    type Address,
    type Hex,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    toHex
} from "viem"
import {
    type CallType,
    type ExecutionMode,
    encodeExecutionMode
} from "../actions/erc7579/supportsExecutionMode"

export type EncodeCallDataParams<callType extends CallType> = {
    mode: ExecutionMode<callType>
    callData: callType extends "batchcall"
        ? {
              to: Address
              value: bigint
              data: Hex
          }[]
        : {
              to: Address
              value: bigint
              data: Hex
          }
}

export function encode7579CallData<callType extends CallType>({
    mode,
    callData
}: EncodeCallDataParams<callType>): Hex {
    if (Array.isArray(callData) && mode?.type !== "batchcall") {
        throw new Error(
            `mode ${JSON.stringify(mode)} does not supported for batchcall calldata`
        )
    }

    const executeAbi = [
        {
            type: "function",
            name: "execute",
            inputs: [
                {
                    name: "execMode",
                    type: "bytes32",
                    internalType: "ExecMode"
                },
                {
                    name: "executionCalldata",
                    type: "bytes",
                    internalType: "bytes"
                }
            ],
            outputs: [],
            stateMutability: "payable"
        }
    ] as const

    if (Array.isArray(callData)) {
        return encodeFunctionData({
            abi: executeAbi,
            functionName: "execute",
            args: [
                encodeExecutionMode(mode),
                encodeAbiParameters(
                    [
                        {
                            name: "executionBatch",
                            type: "tuple[]",
                            components: [
                                {
                                    name: "target",
                                    type: "address"
                                },
                                {
                                    name: "value",
                                    type: "uint256"
                                },
                                {
                                    name: "callData",
                                    type: "bytes"
                                }
                            ]
                        }
                    ],
                    [
                        callData.map((arg) => {
                            return {
                                target: arg.to,
                                value: arg.value,
                                callData: arg.data
                            }
                        })
                    ]
                )
            ]
        })
    }

    return encodeFunctionData({
        abi: executeAbi,
        functionName: "execute",
        args: [
            encodeExecutionMode(mode),
            concatHex([
                callData.to,
                toHex(callData.value, { size: 32 }),
                callData.data
            ])
        ]
    })
}
