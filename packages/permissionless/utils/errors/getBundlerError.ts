import {
    type Address,
    BaseError,
    ExecutionRevertedError,
    type ExecutionRevertedErrorType,
    UnknownNodeError,
    type UnknownNodeErrorType
} from "viem"
import { SenderAlreadyDeployedError } from "../../errors"
import {
    InitCodeDidNotDeploySenderError,
    type InitCodeDidNotDeploySenderErrorType,
    InitCodeRevertedError,
    type InitCodeRevertedErrorType,
    InvalidSmartAccountNonceError,
    type InvalidSmartAccountNonceErrorType,
    SenderAddressMismatchError,
    type SenderAddressMismatchErrorType,
    type SenderAlreadyDeployedErrorType,
    SenderNotDeployedError,
    type SenderNotDeployedErrorType,
    SmartAccountInsufficientFundsError,
    type SmartAccountInsufficientFundsErrorType,
    SmartAccountSignatureValidityPeriodError,
    type SmartAccountSignatureValidityPeriodErrorType,
    SmartAccountValidationRevertedError,
    type SmartAccountValidationRevertedErrorType
} from "../../errors/account"
import {
    PaymasterDataRejectedError,
    type PaymasterDataRejectedErrorType,
    PaymasterDepositTooLowError,
    type PaymasterDepositTooLowErrorType,
    PaymasterNotDeployedError,
    type PaymasterNotDeployedErrorType,
    PaymasterValidationRevertedError,
    type PaymasterValidationRevertedErrorType,
    PaymasterValidityPeriodError,
    type PaymasterValidityPeriodErrorType
} from "../../errors/paymaster"
import type {
    EntryPoint,
    GetEntryPointVersion,
    UserOperation
} from "../../types"

export type GetBundlerErrorParameters<entryPoint extends EntryPoint> = {
    userOperation: Partial<UserOperation<GetEntryPointVersion<entryPoint>>>
    entryPoint: Address
}

export type GetBundlerErrorReturnType =
    | ExecutionRevertedErrorType
    | UnknownNodeErrorType
    | SenderAlreadyDeployedErrorType
    | InitCodeRevertedErrorType
    | SenderAddressMismatchErrorType
    | InitCodeDidNotDeploySenderErrorType
    | SenderNotDeployedErrorType
    | SmartAccountInsufficientFundsErrorType
    | SmartAccountSignatureValidityPeriodErrorType
    | SmartAccountValidationRevertedErrorType
    | InvalidSmartAccountNonceErrorType
    | PaymasterNotDeployedErrorType
    | PaymasterDepositTooLowErrorType
    | PaymasterValidityPeriodErrorType
    | PaymasterValidationRevertedErrorType
    | PaymasterDataRejectedErrorType

export function getBundlerError<entryPoint extends EntryPoint>(
    err: BaseError,
    args: GetBundlerErrorParameters<entryPoint>
) {
    const message = (err.details || "").toLowerCase()

    const executionRevertedError =
        err instanceof BaseError
            ? err.walk(
                  (e) =>
                      (e as { code: number }).code ===
                      ExecutionRevertedError.code
              )
            : err

    if (executionRevertedError instanceof BaseError) {
        return new ExecutionRevertedError({
            cause: err,
            message: executionRevertedError.details
        }) as ExecutionRevertedErrorType
    }

    // TODO: Add validation Errors
    if (args.userOperation.sender === undefined)
        return new UnknownNodeError({ cause: err })
    if (args.userOperation.nonce === undefined)
        return new UnknownNodeError({ cause: err })

    if (SenderAlreadyDeployedError.message.test(message)) {
        return new SenderAlreadyDeployedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa10"
        }) as SenderAlreadyDeployedErrorType
    }

    if (InitCodeRevertedError.message.test(message)) {
        return new InitCodeRevertedError({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa13"
        }) as InitCodeRevertedErrorType
    }

    if (SenderAddressMismatchError.message.test(message)) {
        return new SenderAddressMismatchError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa14"
        }) as SenderAddressMismatchErrorType
    }

    if (InitCodeDidNotDeploySenderError.message.test(message)) {
        return new InitCodeDidNotDeploySenderError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa15"
        }) as InitCodeDidNotDeploySenderErrorType
    }

    if (SenderNotDeployedError.message.test(message)) {
        return new SenderNotDeployedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa20"
        }) as SenderNotDeployedErrorType
    }

    if (SmartAccountInsufficientFundsError.message.test(message)) {
        return new SmartAccountInsufficientFundsError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa21"
        }) as SmartAccountInsufficientFundsErrorType
    }

    if (SmartAccountSignatureValidityPeriodError.message.test(message)) {
        return new SmartAccountSignatureValidityPeriodError({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa22"
        }) as SmartAccountSignatureValidityPeriodErrorType
    }

    if (SmartAccountValidationRevertedError.message.test(message)) {
        return new SmartAccountValidationRevertedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa23"
        }) as SmartAccountValidationRevertedErrorType
    }

    if (InvalidSmartAccountNonceError.message.test(message)) {
        return new InvalidSmartAccountNonceError({
            cause: err,
            sender: args.userOperation.sender,
            nonce: args.userOperation.nonce,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa25"
        }) as InvalidSmartAccountNonceErrorType
    }

    if (PaymasterNotDeployedError.message.test(message)) {
        return new PaymasterNotDeployedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa30"
        }) as PaymasterNotDeployedErrorType
    }

    if (PaymasterDepositTooLowError.message.test(message)) {
        return new PaymasterDepositTooLowError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa31"
        }) as PaymasterDepositTooLowErrorType
    }

    if (PaymasterValidityPeriodError.message.test(message)) {
        return new PaymasterValidityPeriodError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa32"
        }) as PaymasterValidityPeriodErrorType
    }

    if (PaymasterValidationRevertedError.message.test(message)) {
        return new PaymasterValidationRevertedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa33"
        }) as PaymasterValidationRevertedErrorType
    }

    if (PaymasterDataRejectedError.message.test(message)) {
        return new PaymasterDataRejectedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa34"
        }) as PaymasterDataRejectedErrorType
    }

    return new UnknownNodeError({ cause: err }) as UnknownNodeErrorType
}
