import { type Hex, decodeFunctionData } from "viem"
import { decode7579Calls } from "../../../utils/decode7579Calls.js"
import { KernelExecuteAbi } from "../abi/KernelAccountAbi.js"
import type { KernelVersion } from "../toKernelSmartAccount.js"
import { isKernelV2 } from "./isKernelV2.js"

export const decodeCallData = ({
    kernelVersion,
    callData
}: {
    callData: Hex
    kernelVersion: KernelVersion<"0.6" | "0.7">
}) => {
    if (isKernelV2(kernelVersion)) {
        const decoded = decodeFunctionData({
            abi: KernelExecuteAbi,
            data: callData
        })

        if (decoded.functionName === "executeBatch") {
            return decoded.args[0].map((tx) => ({
                to: tx.to,
                value: tx.value,
                data: tx.data
            }))
        }

        if (decoded.functionName === "execute") {
            const [to, value, data] = decoded.args
            return [
                {
                    to,
                    value,
                    data
                }
            ]
        }

        throw new Error("Invalid function name")
    }

    return decode7579Calls(callData).callData
}
