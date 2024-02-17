import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE
} from "../types"
import type { EntryPoint, GetEntryPointVersion } from "../types/entrypoint"

export const ENTRYPOINT_ADDRESS_V06: ENTRYPOINT_ADDRESS_V06_TYPE =
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export const ENTRYPOINT_ADDRESS_V07: ENTRYPOINT_ADDRESS_V07_TYPE =
    "0xA959db6F3798192dC21BdFa6C46B6AD8D1b7eDa3"

export const getEntryPointVersion = (
    entryPoint: EntryPoint
): GetEntryPointVersion<EntryPoint> =>
    entryPoint === ENTRYPOINT_ADDRESS_V06 ? "v0.6" : "v0.7"
