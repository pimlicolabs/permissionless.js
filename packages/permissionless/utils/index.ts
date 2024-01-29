import type { Account, Address } from "viem"
import { deepHexlify, transactionReceiptStatus } from "./deepHexlify.js"
import { getAction } from "./getAction.js"
import { getAddressFromInitCodeOrPaymasterAndData } from "./getAddressFromInitCodeOrPaymasterAndData.js"
import {
    type GetRequiredPrefundReturnType,
    getRequiredPrefund
} from "./getRequiredPrefund.js"
import {
    type GetUserOperationHashParams,
    getUserOperationHash
} from "./getUserOperationHash.js"
import { isSmartAccountDeployed } from "./isSmartAccountDeployed.js"
import { providerToSmartAccountSigner } from "./providerToSmartAccountSigner.js"
import {
    AccountOrClientNotFoundError,
    type SignUserOperationHashWithECDSAParams,
    signUserOperationHashWithECDSA
} from "./signUserOperationHashWithECDSA.js"
import { walletClientToSmartAccountSigner } from "./walletClientToSmartAccountSigner.js"

export function parseAccount(account: Address | Account): Account {
    if (typeof account === "string")
        return { address: account, type: "json-rpc" }
    return account
}

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
    getAddressFromInitCodeOrPaymasterAndData
}
