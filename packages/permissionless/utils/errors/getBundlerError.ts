import {
    type Address,
    BaseError,
    ExecutionRevertedError,
    UnknownNodeError,
    type ExecutionRevertedErrorType,
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
import type { UserOperation } from "../../types"

export type GetBundlerErrorParameters = {
    userOperation: Partial<UserOperation>
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

export function getBundlerError(
    err: BaseError,
    args: GetBundlerErrorParameters
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
        }) as any
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
        }) as any
    }

    if (InitCodeRevertedError.message.test(message)) {
        return new InitCodeRevertedError({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa13"
        }) as any
    }

    if (SenderAddressMismatchError.message.test(message)) {
        return new SenderAddressMismatchError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa14"
        }) as any
    }

    if (InitCodeDidNotDeploySenderError.message.test(message)) {
        return new InitCodeDidNotDeploySenderError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa15"
        }) as any
    }

    if (SenderNotDeployedError.message.test(message)) {
        return new SenderNotDeployedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa20"
        }) as any
    }

    if (SmartAccountInsufficientFundsError.message.test(message)) {
        return new SmartAccountInsufficientFundsError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa21"
        }) as any
    }

    if (SmartAccountSignatureValidityPeriodError.message.test(message)) {
        return new SmartAccountSignatureValidityPeriodError({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa22"
        }) as any
    }

    if (SmartAccountValidationRevertedError.message.test(message)) {
        return new SmartAccountValidationRevertedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa23"
        }) as any
    }

    if (InvalidSmartAccountNonceError.message.test(message)) {
        return new InvalidSmartAccountNonceError({
            cause: err,
            sender: args.userOperation.sender,
            nonce: args.userOperation.nonce,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa25"
        }) as any
    }

    if (PaymasterNotDeployedError.message.test(message)) {
        return new PaymasterNotDeployedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa30"
        }) as any
    }

    if (PaymasterDepositTooLowError.message.test(message)) {
        return new PaymasterDepositTooLowError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa31"
        }) as any
    }

    if (PaymasterValidityPeriodError.message.test(message)) {
        return new PaymasterValidityPeriodError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa32"
        }) as any
    }

    if (PaymasterValidationRevertedError.message.test(message)) {
        return new PaymasterValidationRevertedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa33"
        }) as any
    }

    if (PaymasterDataRejectedError.message.test(message)) {
        return new PaymasterDataRejectedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa34"
        }) as any
    }

    return new UnknownNodeError({ cause: err }) as any
}
