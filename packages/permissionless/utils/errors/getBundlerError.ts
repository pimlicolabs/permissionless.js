import {
    type Address,
    BaseError,
    ExecutionRevertedError,
    UnknownNodeError
} from "viem"
import { SenderAlreadyDeployedError } from "../../errors"
import {
    InitCodeDidNotDeploySenderError,
    InitCodeRevertedError,
    InvalidSmartAccountNonceError,
    SenderAddressMismatchError,
    SenderNotDeployedError,
    SmartAccountInsufficientFundsError,
    SmartAccountSignatureValidityPeriodError,
    SmartAccountValidationRevertedError
} from "../../errors/account"
import {
    PaymasterDataRejectedError,
    PaymasterDepositTooLowError,
    PaymasterNotDeployedError,
    PaymasterValidationRevertedError,
    PaymasterValidityPeriodError
} from "../../errors/paymaster"
import type { UserOperation } from "../../types"

export type GetBundlerErrorParameters = {
    userOperation: Partial<UserOperation>
    entryPoint: Address
}

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
        })
    }

    if (InitCodeRevertedError.message.test(message)) {
        return new InitCodeRevertedError({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa13"
        })
    }

    if (SenderAddressMismatchError.message.test(message)) {
        return new SenderAddressMismatchError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa14"
        })
    }

    if (InitCodeDidNotDeploySenderError.message.test(message)) {
        return new InitCodeDidNotDeploySenderError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa15"
        })
    }

    if (SenderNotDeployedError.message.test(message)) {
        return new SenderNotDeployedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa20"
        })
    }

    if (SmartAccountInsufficientFundsError.message.test(message)) {
        return new SmartAccountInsufficientFundsError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa21"
        })
    }

    if (SmartAccountSignatureValidityPeriodError.message.test(message)) {
        return new SmartAccountSignatureValidityPeriodError({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa22"
        })
    }

    if (SmartAccountValidationRevertedError.message.test(message)) {
        return new SmartAccountValidationRevertedError({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa23"
        })
    }

    if (InvalidSmartAccountNonceError.message.test(message)) {
        return new InvalidSmartAccountNonceError({
            cause: err,
            sender: args.userOperation.sender,
            nonce: args.userOperation.nonce,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa25"
        })
    }

    if (PaymasterNotDeployedError.message.test(message)) {
        return new PaymasterNotDeployedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa30"
        })
    }

    if (PaymasterDepositTooLowError.message.test(message)) {
        return new PaymasterDepositTooLowError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa31"
        })
    }

    if (PaymasterValidityPeriodError.message.test(message)) {
        return new PaymasterValidityPeriodError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa32"
        })
    }

    if (PaymasterValidationRevertedError.message.test(message)) {
        return new PaymasterValidationRevertedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa33"
        })
    }

    if (PaymasterDataRejectedError.message.test(message)) {
        return new PaymasterDataRejectedError({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa34"
        })
    }

    return new UnknownNodeError({ cause: err })
}
