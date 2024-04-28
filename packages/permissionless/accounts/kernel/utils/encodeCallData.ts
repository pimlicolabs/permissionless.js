import {
    type Address,
    type Hex,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    toHex
} from "viem"
import { KernelExecuteAbi } from "../abi/KernelAccountAbi"
import { KernelV3ExecuteAbi } from "../abi/KernelV3AccountAbi"
import { CALL_TYPE, EXEC_TYPE } from "../constants"
import type { KernelVersion } from "../signerToEcdsaKernelSmartAccount"
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
          }[],
    accountVersion: KernelVersion
) => {
    if (accountVersion === "0.2.2") {
        if (Array.isArray(_tx)) {
            // Encode a batched call
            return encodeFunctionData({
                abi: KernelExecuteAbi,
                functionName: "executeBatch",
                args: [
                    _tx.map((tx) => ({
                        to: tx.to,
                        value: tx.value,
                        data: tx.data
                    }))
                ]
            })
        }
        // Encode a simple call
        return encodeFunctionData({
            abi: KernelExecuteAbi,
            functionName: "execute",
            args: [_tx.to, _tx.value, _tx.data, 0]
        })
    }
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
            abi: KernelV3ExecuteAbi,
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
        abi: KernelV3ExecuteAbi,
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
