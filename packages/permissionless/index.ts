import type {
    EstimateUserOperationGasParameters,
    EstimateUserOperationGasReturnType
} from "./actions/bundler/estimateUserOperationGas.js"
import type { GetUserOperationByHashParameters } from "./actions/bundler/getUserOperationByHash.js"
import type { GetUserOperationByHashReturnType } from "./actions/bundler/getUserOperationByHash.js"
import type {
    GetUserOperationReceiptParameters,
    GetUserOperationReceiptReturnType
} from "./actions/bundler/getUserOperationReceipt.js"
import type { SendUserOperationParameters } from "./actions/bundler/sendUserOperation.js"

import type { GetSenderAddressParams } from "./actions/public/getSenderAddress.js"
import { getSenderAddress } from "./actions/public/getSenderAddress.js"

import { chainId } from "./actions/bundler/chainId.js"
import { estimateUserOperationGas } from "./actions/bundler/estimateUserOperationGas.js"
import { getUserOperationByHash } from "./actions/bundler/getUserOperationByHash.js"
import { getUserOperationReceipt } from "./actions/bundler/getUserOperationReceipt.js"
import { sendUserOperation } from "./actions/bundler/sendUserOperation.js"
import { supportedEntryPoints } from "./actions/bundler/supportedEntryPoints.js"
import { waitForUserOperationReceipt } from "./actions/bundler/waitForUserOperationReceipt.js"
import {
    type WaitForUserOperationReceiptParameters,
    WaitForUserOperationReceiptTimeoutError
} from "./actions/bundler/waitForUserOperationReceipt.js"
import type { GetAccountNonceParams } from "./actions/public/getAccountNonce.js"
import { getAccountNonce } from "./actions/public/getAccountNonce.js"
import {
    type BundlerClient,
    createBundlerClient
} from "./clients/createBundlerClient.js"
import { createSmartAccountClient } from "./clients/createSmartAccountClient.js"
import {
    type SmartAccountClient,
    type SmartAccountClientConfig
} from "./clients/createSmartAccountClient.js"
import type { BundlerActions } from "./clients/decorators/bundler.js"
import { bundlerActions } from "./clients/decorators/bundler.js"
import {
    type SmartAccountActions,
    smartAccountActions
} from "./clients/decorators/smartAccount.js"

export type {
    SendUserOperationParameters,
    EstimateUserOperationGasParameters,
    EstimateUserOperationGasReturnType,
    GetUserOperationByHashParameters,
    GetUserOperationByHashReturnType,
    GetUserOperationReceiptParameters,
    GetUserOperationReceiptReturnType,
    GetSenderAddressParams,
    GetAccountNonceParams,
    BundlerClient,
    BundlerActions,
    WaitForUserOperationReceiptParameters,
    SmartAccountClient,
    SmartAccountClientConfig,
    SmartAccountActions
}

export {
    sendUserOperation,
    estimateUserOperationGas,
    supportedEntryPoints,
    chainId,
    getUserOperationByHash,
    getUserOperationReceipt,
    getSenderAddress,
    getAccountNonce,
    waitForUserOperationReceipt,
    createBundlerClient,
    bundlerActions,
    WaitForUserOperationReceiptTimeoutError,
    createSmartAccountClient,
    smartAccountActions
}
import type { UserOperation } from "./types/userOperation.js"

export { type UserOperation }

import type { GetUserOperationHashParams } from "./utils/getUserOperationHash.js"
import { getUserOperationHash } from "./utils/getUserOperationHash.js"

export { getUserOperationHash, type GetUserOperationHashParams }
export * from "./utils/index.js"
export * from "./errors/index.js"
