import {
    type Address,
    type Hex,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    toHex
} from "viem"
import { EtherspotExecuteAbi } from "../abi/EtherspotExecuteAbi"
import { CALL_TYPE, EXEC_TYPE } from "../constants"
import { getExecMode } from "./getExecMode"

export const encodeCallData = (
    _tx:
        | {
              to: Address
              value: bigint
              data: Hex
          }
        | {
              to: Address
              value: bigint
              data: Hex
          }[]
) => {
    if (Array.isArray(_tx)) {
        // Encode a batched call
        const calldata = encodeAbiParameters(
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
                _tx.map((arg) => {
                    return {
                        target: arg.to,
                        value: arg.value,
                        callData: arg.data
                    }
                })
            ]
        )
        return encodeFunctionData({
            abi: EtherspotExecuteAbi,
            functionName: "execute",
            args: [
                getExecMode({
                    callType: CALL_TYPE.BATCH,
                    execType: EXEC_TYPE.DEFAULT
                }),
                calldata
            ]
        })
    }

    const calldata = concatHex([
        _tx.to,
        toHex(_tx.value, { size: 32 }),
        _tx.data
    ])

    return encodeFunctionData({
        abi: EtherspotExecuteAbi,
        functionName: "execute",
        args: [
            getExecMode({
                callType: CALL_TYPE.SINGLE,
                execType: EXEC_TYPE.DEFAULT
            }),
            calldata
        ]
    })
}
