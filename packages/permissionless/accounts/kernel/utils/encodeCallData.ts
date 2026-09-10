import { AbiFunction, type Address, type Hex } from "viem/utils"
import { EmptyCallsError } from "../../../errors/account.js"
import { encode7579Calls } from "../../../utils/encode7579Calls.js"
import { KernelExecuteAbi } from "../abi/KernelAccountAbi.js"
import { isKernelV2, type Version } from "../version.js"

export const encodeCallData = ({
    version,
    calls
}: {
    calls: readonly {
        to: Address.Address
        value?: bigint | undefined
        data?: Hex.Hex | undefined
    }[]
    version: Version
}) => {
    if (!isKernelV2(version))
        return encode7579Calls({
            mode: {
                type: calls.length > 1 ? "batchcall" : "call",
                revertOnError: false,
                selector: "0x",
                context: "0x"
            },
            callData: calls
        })
    if (calls.length > 1)
        return AbiFunction.encodeData(KernelExecuteAbi, "executeBatch", [
            calls.map((call) => ({
                to: call.to,
                value: call.value ?? 0n,
                data: call.data ?? "0x"
            }))
        ])
    const [call] = calls
    if (!call) throw new EmptyCallsError()
    return AbiFunction.encodeData(KernelExecuteAbi, "execute", [
        call.to,
        call.value ?? 0n,
        call.data ?? "0x",
        0
    ])
}
