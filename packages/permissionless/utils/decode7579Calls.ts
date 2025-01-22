import {
    type Address,
    type Hex,
    decodeAbiParameters,
    decodeFunctionData,
    getAddress,
    size,
    slice
} from "viem"
import type {
    CallType,
    ExecutionMode
} from "../actions/erc7579/supportsExecutionMode.js"

export type DecodeCallDataReturnType = {
    mode: ExecutionMode<CallType>
    callData: readonly {
        to: Address
        value?: bigint | undefined
        data?: Hex | undefined
    }[]
}

export function decode7579Calls(callData: Hex): DecodeCallDataReturnType {
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

    const decoded = decodeFunctionData({
        abi: executeAbi,
        data: callData
    })

    const mode = decoded.args[0]
    const executionCalldata = decoded.args[1]

    const callType = slice(mode, 0, 1) // First byte
    const revertOnError = slice(mode, 1, 2) // Second byte
    const selector = slice(mode, 3, 7) as Hex // bytes 5-8
    const context = slice(mode, 7) as Hex // bytes 9-32

    let type: CallType
    switch (BigInt(callType)) {
        case BigInt(0x00):
            type = "call"
            break
        case BigInt(0x01):
            type = "batchcall"
            break
        case BigInt(0xff):
            type = "delegatecall"
            break
        default:
            throw new Error("Invalid call type")
    }

    const decodedMode: ExecutionMode<CallType> = {
        type,
        revertOnError: BigInt(revertOnError) === BigInt(1),
        selector,
        context
    }

    if (decodedMode.type === "batchcall") {
        const [calls] = decodeAbiParameters(
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
            executionCalldata
        )

        return {
            mode: decodedMode,
            callData: calls.map((call) => ({
                to: call.target,
                value: call.value,
                data: call.callData
            }))
        }
    }

    // Single call - calldata is encoded as concatenated (to, value, data)
    const to = getAddress(slice(executionCalldata, 0, 20)) // 20 bytes address with 0x prefix
    const value = BigInt(slice(executionCalldata, 20, 52)) // 32 bytes value

    const data =
        size(executionCalldata) > 52 ? slice(executionCalldata, 52) : "0x" // Remaining bytes are calldata

    return {
        mode: decodedMode,
        callData: [
            {
                to,
                value,
                data
            }
        ]
    }
}
