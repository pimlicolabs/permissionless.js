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

export const DEFAULT_CONTRACT_ADDRESS = {
    modularEtherspotWalletFactory: "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
    modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
    bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
    multipleOwnerECDSAValidator: "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
}

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
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [84532]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [10]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [137]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [42161]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [1]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [10200]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [122]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [123]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [100]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [2357]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [30]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [31]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [20197]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [5000]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [5003]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [43114]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [8453]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [56]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [97]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [43113]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [59144]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [59140]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [114]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [14]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [534351]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [534352]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [11155420]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [28122024]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [888888888]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [80002]: {
        modularEtherspotWalletFactory:
            "0xf80D543Ca10B48AF07c65Ff508605c1737EFAF3F",
        modularEtherspotWallet: "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9",
        bootstrap: "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066",
        multipleOwnerECDSAValidator:
            "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143"
    },
    [51]: {
        modularEtherspotWalletFactory:
            "0x3aa509fd07B09d5a8b944c96ae6eE767fe75C465",
        modularEtherspotWallet: "0x15A58094F4DE350ff7F3Ea94B5051a8a4c938Ad5",
        bootstrap: "0xCF9bf036D63641003566FD8B10817Dd7168ac5Cb",
        multipleOwnerECDSAValidator:
            "0x61a5eb96F597c72cd24a32D4e241fCA5b22f3dDb"
    }
}
