import { type Hex, concatHex, pad } from "viem"
import type { CALL_TYPE, EXEC_TYPE } from "../constants"

export const getExecMode = ({
    callType,
    execType
}: {
    callType: CALL_TYPE
    execType: EXEC_TYPE
}): Hex => {
    return concatHex([
        callType, // 1 byte
        execType, // 1 byte
        "0x00000000", // 4 bytes
        "0x00000000", // 4 bytes
        pad("0x00000000", { size: 22 })
    ])
}
