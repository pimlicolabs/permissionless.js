import { type Address, type Hex, encodeFunctionData } from "viem"
import { encode7579Calls } from "../../../utils/encode7579Calls.js"
import { KernelExecuteAbi } from "../abi/KernelAccountAbi.js"
import type { KernelVersion } from "../toKernelSmartAccount.js"
import { isKernelV2 } from "./isKernelV2.js"

export const encodeCallData = ({
    kernelVersion,
    calls
}: {
    calls: readonly {
        to: Address
        value?: bigint | undefined
        data?: Hex | undefined
    }[]
    kernelVersion: KernelVersion<"0.6" | "0.7">
}) => {
    if (isKernelV2(kernelVersion)) {
        if (calls.length > 1) {
            // Encode a batched call
            return encodeFunctionData({
                abi: KernelExecuteAbi,
                functionName: "executeBatch",
                args: [
                    calls.map((tx) => ({
                        to: tx.to,
                        value: tx.value ?? 0n,
                        data: tx.data ?? "0x"
                    }))
                ]
            })
        }

        const call = calls.length === 0 ? undefined : calls[0]

        if (!call) {
            throw new Error("No calls to encode")
        }

        // Encode a simple call
        return encodeFunctionData({
            abi: KernelExecuteAbi,
            functionName: "execute",
            args: [call.to, call.value ?? 0n, call.data ?? "0x", 0]
        })
    }

    return encode7579Calls({
        mode: {
            type: calls.length > 1 ? "batchcall" : "call",
            revertOnError: false,
            selector: "0x",
            context: "0x"
        },
        callData: calls
    })
}
