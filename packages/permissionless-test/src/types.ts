import type { Address, Hex, PublicClient } from "viem"

export type AAParamType<entryPointVersion extends "0.6" | "0.7"> = {
    entryPoint: {
        version: entryPointVersion
    }
    anvilRpc: string
    altoRpc: string
    paymasterRpc: string
}

// param used when testing with a already deployed contract
export type ExistingSignerParamType = {
    publicClient: PublicClient
    privateKey: Hex
    existingAddress: Address
}
