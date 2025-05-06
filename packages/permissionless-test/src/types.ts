import type { Hex } from "viem"
import type { EntryPointVersion } from "viem/account-abstraction"

export type AAParamType<entryPointVersion extends EntryPointVersion> = {
    entryPoint: {
        version: entryPointVersion
    }
    anvilRpc: string
    altoRpc: string
    paymasterRpc: string
    privateKey?: Hex
}
