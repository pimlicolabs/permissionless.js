import type { Account, Address } from "viem"
import { deepHexlify, transactionReceiptStatus } from "./deepHexlify"
import { getAction } from "./getAction"
import { getAddressFromInitCodeOrPaymasterAndData } from "./getAddressFromInitCodeOrPaymasterAndData"
import {
    type GetRequiredPrefundReturnType,
    getRequiredPrefund
} from "./getRequiredPrefund"
import {
    type GetUserOperationHashParams,
    getUserOperationHash
} from "./getUserOperationHash"
import { isSmartAccountDeployed } from "./isSmartAccountDeployed"
import { providerToSmartAccountSigner } from "./providerToSmartAccountSigner"
import {
    AccountOrClientNotFoundError,
    type SignUserOperationHashWithECDSAParams,
    signUserOperationHashWithECDSA
} from "./signUserOperationHashWithECDSA"
import { walletClientToSmartAccountSigner } from "./walletClientToSmartAccountSigner"

export function parseAccount(account: Address | Account): Account {
    if (typeof account === "string")
        return { address: account, type: "json-rpc" }
    return account
}
import {
    ENTRYPOINT_ADDRESS_0_6,
    ENTRYPOINT_ADDRESS_0_7,
    getEntryPointVersion
} from "./getEntryPointVersion"

export {
    transactionReceiptStatus,
    deepHexlify,
    getAction,
    getUserOperationHash,
    getRequiredPrefund,
    walletClientToSmartAccountSigner,
    type GetRequiredPrefundReturnType,
    type GetUserOperationHashParams,
    signUserOperationHashWithECDSA,
    type SignUserOperationHashWithECDSAParams,
    AccountOrClientNotFoundError,
    isSmartAccountDeployed,
    providerToSmartAccountSigner,
    getAddressFromInitCodeOrPaymasterAndData,
    getEntryPointVersion,
    ENTRYPOINT_ADDRESS_0_6,
    ENTRYPOINT_ADDRESS_0_7
}
