import type { Account, Address } from "viem"
import { deepHexlify, transactionReceiptStatus } from "./deepHexlify.js"
import { getAction } from "./getAction.js"
import {
    type GetRequiredPrefundReturnType,
    getRequiredPrefund
} from "./getRequiredPrefund.js"
import {
    type GetUserOperationHashParams,
    getUserOperationHash
} from "./getUserOperationHash.js"
import { isSmartAccountDeployed } from "./isSmartAccountDeployed"
import {
    AccountOrClientNotFoundError,
    type SignUserOperationHashWithECDSAParams,
    signUserOperationHashWithECDSA
} from "./signUserOperationHashWithECDSA.js"
import { walletClientToCustomSigner } from "./walletClientToCustomSigner.js"

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
    walletClientToCustomSigner,
    type GetRequiredPrefundReturnType,
    type GetUserOperationHashParams,
    signUserOperationHashWithECDSA,
    type SignUserOperationHashWithECDSAParams,
    AccountOrClientNotFoundError,
    isSmartAccountDeployed
}
