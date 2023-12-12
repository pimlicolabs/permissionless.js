import type { Account, Address } from "viem"
import {
    type GetRequiredPrefundReturnType,
    getRequiredPrefund
} from "./getRequiredPrefund.js"
import {
    type GetUserOperationHashParams,
    getUserOperationHash
} from "./getUserOperationHash.js"
import {
    AccountOrClientNotFoundError,
    signUserOperationHashWithECDSA
} from "./signUserOperationHashWithECDSA.js"

export function parseAccount(account: Address | Account): Account {
    if (typeof account === "string")
        return { address: account, type: "json-rpc" }
    return account
}

export {
    getUserOperationHash,
    getRequiredPrefund,
    type GetRequiredPrefundReturnType,
    type GetUserOperationHashParams,
    signUserOperationHashWithECDSA,
    AccountOrClientNotFoundError
}
