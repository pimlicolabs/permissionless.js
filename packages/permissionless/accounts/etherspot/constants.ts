import type { Address } from "viem"

export const DUMMY_ECDSA_SIGNATURE =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

export const VALIDATOR_TYPE = {
    ROOT: "0x00",
    VALIDATOR: "0x01",
    PERMISSION: "0x02"
} as const

export enum VALIDATOR_MODE {
    DEFAULT = "0x00",
    ENABLE = "0x01"
}

export type NetworkAddresses = {
    metaFactoryAddress: Address
    bootstrapAddress: Address
    validatorAddress: Address
}

export const DEFAULT_CONTRACT_ADDRESS: NetworkAddresses = {
    metaFactoryAddress: "0x93FB56A4a0B7160fbf8903d251Cc7A3fb9bA0933", // modularEtherspotWalletFactory
    bootstrapAddress: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
    validatorAddress: "0x7aCEE15c9FFc1e8f287C26E0f4C8244A0729F557" // multipleOwnerECDSAValidator
}
