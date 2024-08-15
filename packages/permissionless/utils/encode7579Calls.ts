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
    callData: readonly {
        to: Address
        value?: bigint | undefined
        data?: Hex | undefined
    }[]
}

export function encode7579Calls<callType extends CallType>({
    mode,
    callData
}: EncodeCallDataParams<callType>): Hex {
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

    if (callData.length > 1) {
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
                                value: arg.value ?? 0n,
                                callData: arg.data ?? "0x"
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
                callData[0].to,
                toHex(callData[0].value ?? 0n, { size: 32 }),
                callData[0].data ?? "0x"
            ])
        ]
    })
}
