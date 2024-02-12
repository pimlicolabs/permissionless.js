export type EntryPointVersion = "0.6" | "0.7"

export type DefaultEntryPoint = ENTRYPOINT_ADDRESS_0_6

export type ENTRYPOINT_ADDRESS_0_6 =
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export type ENTRYPOINT_ADDRESS_0_7 =
    "0xA959db6F3798192dC21BdFa6C46B6AD8D1b7eDa3"

export type GetEntryPointVersion<entryPoint extends EntryPoint> =
    entryPoint extends ENTRYPOINT_ADDRESS_0_6 ? "0.6" : "0.7"

export type EntryPoint = ENTRYPOINT_ADDRESS_0_6 | ENTRYPOINT_ADDRESS_0_7
