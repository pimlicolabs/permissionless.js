import { type Address } from "viem"

export const DUMMY_ECDSA_SIGNATURE =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
export const ROOT_MODE_KERNEL_V2 = "0x00000000"

export enum CALL_TYPE {
    SINGLE = "0x00",
    BATCH = "0x01",
    DELEGATE_CALL = "0xFF"
}

export enum EXEC_TYPE {
    DEFAULT = "0x00",
    TRY_EXEC = "0x01"
}

export const VALIDATOR_TYPE = {
    ROOT: "0x00",
    VALIDATOR: "0x01",
    PERMISSION: "0x02"
} as const

export enum VALIDATOR_MODE {
    DEFAULT = "0x00",
    ENABLE = "0x01"
}

export const supportedNetworks = [11155111]

export const Networks: {
    [key: number]: {
        modularEtherspotWalletFactory: Address
        modularEtherspotWallet: Address
        bootstrap: Address
        multipleOwnerECDSAValidator: Address
    }
} = {
    [11155111]: {
        modularEtherspotWalletFactory:
            "0x77E4288A4b15893F520F15C262a07dF9866904e4",
        modularEtherspotWallet: "0x917398dF969752a7d94725740918f38E4B8EeCEc",
        bootstrap: "0x4f695ad7694863c8280FCEBf2Cb220E361ce4eA0",
        multipleOwnerECDSAValidator:
            "0x1E714c551Fe6234B6eE406899Ec3Be9234Ad2124"
    }
}
