import type {
    EstimateUserOperationGasParameters,
    EstimateUserOperationGasReturnType
} from "./actions/bundler/estimateUserOperationGas"
import type { GetUserOperationByHashParameters } from "./actions/bundler/getUserOperationByHash"
import type { GetUserOperationByHashReturnType } from "./actions/bundler/getUserOperationByHash"
import type {
    GetUserOperationReceiptParameters,
    GetUserOperationReceiptReturnType
} from "./actions/bundler/getUserOperationReceipt"
import type { SendUserOperationParameters } from "./actions/bundler/sendUserOperation"

import type { GetSenderAddressParams } from "./actions/public/getSenderAddress"
import { getSenderAddress } from "./actions/public/getSenderAddress"

import { chainId } from "./actions/bundler/chainId"
import { estimateUserOperationGas } from "./actions/bundler/estimateUserOperationGas"
import { getUserOperationByHash } from "./actions/bundler/getUserOperationByHash"
import { getUserOperationReceipt } from "./actions/bundler/getUserOperationReceipt"
import { sendUserOperation } from "./actions/bundler/sendUserOperation"
import { supportedEntryPoints } from "./actions/bundler/supportedEntryPoints"
import { waitForUserOperationReceipt } from "./actions/bundler/waitForUserOperationReceipt"
import {
    type WaitForUserOperationReceiptParameters,
    WaitForUserOperationReceiptTimeoutError
} from "./actions/bundler/waitForUserOperationReceipt"
import type { GetAccountNonceParams } from "./actions/public/getAccountNonce"
import { getAccountNonce } from "./actions/public/getAccountNonce"
import {
    type BundlerClient,
    createBundlerClient
} from "./clients/createBundlerClient"
import { createSmartAccountClient } from "./clients/createSmartAccountClient"
import type {
    SmartAccountClient,
    SmartAccountClientConfig
} from "./clients/createSmartAccountClient"
import type { BundlerActions } from "./clients/decorators/bundler"
import { bundlerActions } from "./clients/decorators/bundler"
import {
    type SmartAccountActions,
    smartAccountActions
} from "./clients/decorators/smartAccount"

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
import type { UserOperation } from "./types/userOperation"

export type { UserOperation }

import type { GetUserOperationHashParams } from "./utils/getUserOperationHash"
import { getUserOperationHash } from "./utils/getUserOperationHash"

export { getUserOperationHash, type GetUserOperationHashParams }
export * from "./utils/"
export * from "./errors/"
