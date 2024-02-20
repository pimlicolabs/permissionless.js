export type EntryPointVersion = "v0.6" | "v0.7"

export type ENTRYPOINT_ADDRESS_V06_TYPE =
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export type ENTRYPOINT_ADDRESS_V07_TYPE =
    "0x7547CAC84A1eF4E6FA8bF83cD89404e7BFB72A4d"

export type GetEntryPointVersion<entryPoint extends EntryPoint> =
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE ? "v0.6" : "v0.7"

export type EntryPoint =
    | ENTRYPOINT_ADDRESS_V06_TYPE
    | ENTRYPOINT_ADDRESS_V07_TYPE
