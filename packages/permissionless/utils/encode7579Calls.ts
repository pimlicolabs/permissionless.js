import { AbiFunction, AbiParameters, type Address, Hex } from "viem/utils"
import {
    type CallType,
    type ExecutionMode,
    encodeExecutionMode
} from "../actions/erc7579/supportsExecutionMode.js"
import { EmptyCallsError } from "../errors/account.js"
import { Erc7579InvalidExecutionModeError } from "../errors/erc7579.js"

export type EncodeCallDataParams<callType extends CallType> = {
    mode: ExecutionMode<callType>
    callData: readonly {
        to: Address.Address
        value?: bigint | undefined
        data?: Hex.Hex | undefined
    }[]
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

export function encode7579Calls<callType extends CallType>({
    mode,
    callData
}: EncodeCallDataParams<callType>): Hex.Hex {
    if (callData.length > 1 && mode?.type !== "batchcall") {
        throw new Erc7579InvalidExecutionModeError({
            type: mode?.type,
            calls: callData.length
        })
    }

    if (callData.length > 1) {
        return AbiFunction.encodeData(executeAbi, "execute", [
            encodeExecutionMode(mode),
            AbiParameters.encode(
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
        ])
    }

    const call = callData.length === 0 ? undefined : callData[0]

    if (!call) throw new EmptyCallsError()

    return AbiFunction.encodeData(executeAbi, "execute", [
        encodeExecutionMode(mode),
        Hex.concat(
            call.to,
            Hex.fromNumber(call.value ?? 0n, { size: 32 }),
            call.data ?? "0x"
        )
    ])
}
