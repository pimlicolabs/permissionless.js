import type { EntryPoint, GetEntryPointVersion } from "../types/entrypoint"
import type {
    ENTRYPOINT_ADDRESS_0_6 as ENTRYPOINT_ADDRESS_0_6_TYPE,
    ENTRYPOINT_ADDRESS_0_7 as ENTRYPOINT_ADDRESS_0_7_TYPE
} from "../types"

export const ENTRYPOINT_ADDRESS_0_6: ENTRYPOINT_ADDRESS_0_6_TYPE =
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export const ENTRYPOINT_ADDRESS_0_7: ENTRYPOINT_ADDRESS_0_7_TYPE =
    "0xA959db6F3798192dC21BdFa6C46B6AD8D1b7eDa3"

export const getEntryPointVersion = (
    entryPoint: EntryPoint
): GetEntryPointVersion<EntryPoint> =>
    entryPoint === ENTRYPOINT_ADDRESS_0_6 ? "0.6" : "0.7"
