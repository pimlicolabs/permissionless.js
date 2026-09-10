import type { EntryPoint } from "viem/erc4337"
import type { Hex } from "viem/utils"

export type AAParamType<entryPointVersion extends EntryPoint.Version> = {
    entryPoint: {
        version: entryPointVersion
    }
    anvilRpc: string
    altoRpc: string
    paymasterRpc: string
    privateKey?: Hex.Hex
}
