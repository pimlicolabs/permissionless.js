export type EntryPointVersion = "v0.6" | "v0.7"

export type ENTRYPOINT_ADDRESS_V06_TYPE =
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
export type ENTRYPOINT_ADDRESS_V07_TYPE =
    "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

export type GetEntryPointVersion<entryPoint extends EntryPoint> =
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE ? "v0.6" : "v0.7"

export type EntryPoint =
    | ENTRYPOINT_ADDRESS_V06_TYPE
    | ENTRYPOINT_ADDRESS_V07_TYPE
