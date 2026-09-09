import { EntryPoint } from "viem/erc4337"
import type { Address } from "viem/utils"

export type EntryPointAbi<version extends EntryPoint.Version> =
    version extends "0.6"
        ? typeof EntryPoint.abiV06
        : version extends "0.7"
          ? typeof EntryPoint.abiV07
          : version extends "0.8"
            ? typeof EntryPoint.abiV08
            : version extends "0.9"
              ? typeof EntryPoint.abiV09
              : never

export type EntryPointParameter<
    version extends EntryPoint.Version = EntryPoint.Version
> = version | { address: Address.Address; version: version }

export type ToEntryPointReturnType<
    version extends EntryPoint.Version = EntryPoint.Version
> = {
    abi: EntryPointAbi<version>
    address: Address.Address
    version: version
}

const entryPoints = {
    "0.6": { abi: EntryPoint.abiV06, address: EntryPoint.addressV06 },
    "0.7": { abi: EntryPoint.abiV07, address: EntryPoint.addressV07 },
    "0.8": { abi: EntryPoint.abiV08, address: EntryPoint.addressV08 },
    "0.9": { abi: EntryPoint.abiV09, address: EntryPoint.addressV09 }
} as const

export function toEntryPoint<version extends EntryPoint.Version>(
    entryPoint: EntryPointParameter<version>
): ToEntryPointReturnType<version> {
    const version =
        typeof entryPoint === "string" ? entryPoint : entryPoint.version
    const address =
        typeof entryPoint === "string"
            ? entryPoints[version].address
            : entryPoint.address
    return {
        abi: entryPoints[version].abi,
        address,
        version
    } as ToEntryPointReturnType<version>
}
