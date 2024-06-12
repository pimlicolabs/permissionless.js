import type { Address, Hex, PublicClient } from "viem"
import type { PimlicoPaymasterClient } from "../../permissionless/clients/pimlico"
import type { EntryPoint } from "../../permissionless/types"

export type AAParamType<T extends EntryPoint> = {
    entryPoint: T
    anvilRpc: string
    altoRpc: string
    paymasterClient?: PimlicoPaymasterClient<T>
    privateKey?: Hex
}

// param used when testing with a already deployed contract
export type ExistingSignerParamType = {
    publicClient: PublicClient
    privateKey: Hex
    existingAddress: Address
}
