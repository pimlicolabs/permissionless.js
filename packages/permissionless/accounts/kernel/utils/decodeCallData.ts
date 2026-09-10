import { AbiFunction, type Hex } from "viem/utils"
import { KernelDecodeCallsError } from "../../../errors/kernel.js"
import { decode7579Calls } from "../../../utils/decode7579Calls.js"
import { KernelExecuteAbi } from "../abi/KernelAccountAbi.js"
import { isKernelV2, type Version } from "../version.js"

const execute = AbiFunction.fromAbi(KernelExecuteAbi, "execute")
const executeBatch = AbiFunction.fromAbi(KernelExecuteAbi, "executeBatch")

export const decodeCallData = ({
    version,
    callData
}: {
    callData: Hex.Hex
    version: Version
}) => {
    if (!isKernelV2(version)) return decode7579Calls(callData).callData
    const { name } = AbiFunction.fromAbi(KernelExecuteAbi, callData)
    if (name === "executeBatch") {
        const [calls] = AbiFunction.decodeData(executeBatch, callData)
        return calls.map(({ to, value, data }) => ({ to, value, data }))
    }
    if (name === "execute") {
        const [to, value, data] = AbiFunction.decodeData(execute, callData)
        return [{ to, value, data }]
    }
    throw new KernelDecodeCallsError({ functionName: name })
}
