import { type Address, type Hex, encodeFunctionData } from "viem"
import { encode7579Calls } from "../../../utils/encode7579Calls"
import { KernelExecuteAbi } from "../abi/KernelAccountAbi"
import type { KernelVersion } from "../toEcdsaKernelSmartAccount"
import { isKernelV2 } from "./isKernelV2"

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
        // Encode a simple call
        return encodeFunctionData({
            abi: KernelExecuteAbi,
            functionName: "execute",
            args: [calls[0].to, calls[0].value ?? 0n, calls[0].data ?? "0x", 0]
        })
    }

    return encode7579Calls({
        mode: {
            type: Array.isArray(calls) ? "batchcall" : "call",
            revertOnError: false,
            selector: "0x",
            context: "0x"
        },
        callData: calls
    })
}
