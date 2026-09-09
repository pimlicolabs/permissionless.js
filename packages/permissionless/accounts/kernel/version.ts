export type EntryPointVersion = "0.6" | "0.7"

export type Version<
    entryPointVersion extends EntryPointVersion = EntryPointVersion
> = entryPointVersion extends "0.6"
    ? "0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"
    : "0.3.0-beta" | "0.3.1" | "0.3.2" | "0.3.3"

export const versions = {
    "0.6": ["0.2.1", "0.2.2", "0.2.3", "0.2.4"],
    "0.7": ["0.3.0-beta", "0.3.1", "0.3.2", "0.3.3"]
} as const satisfies Record<EntryPointVersion, readonly Version[]>

export const isKernelV2 = (version: Version) => version.startsWith("0.2.")
