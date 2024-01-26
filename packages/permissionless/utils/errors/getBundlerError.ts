import {
    UnknownNodeError,
    type Address,
    BaseError,
    ExecutionRevertedError
} from "viem"
import { SmartAccountAlreadyDeployed } from "../../errors"
import {
    InitCodeDidNotDeploySender,
    InitCodeFailedOrOutOfGas,
    InitCodeReturnedDifferentSmartAccountAddress,
    SmartAccountDoNotHaveEnoughFunds,
    SmartAccountNonceInvalid,
    SmartAccountNotDeployed,
    SmartAccountRevertedOrOutOfGasDuringValidation,
    SmartAccountSignatureExpiredOrNotDue
} from "../../errors/account"
import type { UserOperation } from "../../types"
import {
    PaymasterDepositTooLow,
    PaymasterExpiredOrNotDue,
    PaymasterNotDeployed
} from "../../errors/paymaster"

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

    if (SmartAccountAlreadyDeployed.message.test(message)) {
        return new SmartAccountAlreadyDeployed({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa10"
        })
    }

    if (InitCodeFailedOrOutOfGas.message.test(message)) {
        return new InitCodeFailedOrOutOfGas({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa13"
        })
    }

    if (InitCodeReturnedDifferentSmartAccountAddress.message.test(message)) {
        return new InitCodeReturnedDifferentSmartAccountAddress({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa14"
        })
    }

    if (InitCodeDidNotDeploySender.message.test(message)) {
        return new InitCodeDidNotDeploySender({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa15"
        })
    }

    if (SmartAccountNotDeployed.message.test(message)) {
        return new SmartAccountNotDeployed({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa20"
        })
    }

    if (SmartAccountDoNotHaveEnoughFunds.message.test(message)) {
        return new SmartAccountDoNotHaveEnoughFunds({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa21"
        })
    }

    if (SmartAccountSignatureExpiredOrNotDue.message.test(message)) {
        return new SmartAccountSignatureExpiredOrNotDue({
            cause: err,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa22"
        })
    }

    if (SmartAccountRevertedOrOutOfGasDuringValidation.message.test(message)) {
        return new SmartAccountRevertedOrOutOfGasDuringValidation({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa23"
        })
    }

    if (SmartAccountNonceInvalid.message.test(message)) {
        return new SmartAccountNonceInvalid({
            cause: err,
            sender: args.userOperation.sender,
            nonce: args.userOperation.nonce,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa25"
        })
    }

    if (PaymasterNotDeployed.message.test(message)) {
        return new PaymasterNotDeployed({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa30"
        })
    }

    if (PaymasterDepositTooLow.message.test(message)) {
        return new PaymasterDepositTooLow({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa31"
        })
    }

    if (PaymasterExpiredOrNotDue.message.test(message)) {
        return new PaymasterExpiredOrNotDue({
            cause: err,
            paymasterAndData: args.userOperation.paymasterAndData,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa32"
        })
    }

    return new UnknownNodeError({ cause: err })
}
