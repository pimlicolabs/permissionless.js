import type { Account, Address } from "viem"
import { deepHexlify, transactionReceiptStatus } from "./deepHexlify"
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
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07,
    getEntryPointVersion
} from "./getEntryPointVersion"

import { getPackedUserOperation } from "./getPackedUserOperation"

export {
    transactionReceiptStatus,
    deepHexlify,
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
    getPackedUserOperation,
    getEntryPointVersion,
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07
}
