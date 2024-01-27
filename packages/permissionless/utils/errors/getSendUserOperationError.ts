import { BaseError, UnknownNodeError } from "viem"
import { EstimateUserOperationGasError } from "../../errors"
import {
    type GetBundlerErrorParameters,
    getBundlerError
} from "./getBundlerError"
import type { SendUserOperationParameters } from "../../actions/bundler/sendUserOperation"

export function getSendUserOperationError(
    err: BaseError,
    args: SendUserOperationParameters
) {
    const cause = (() => {
        const cause = getBundlerError(
            err as BaseError,
            args as GetBundlerErrorParameters
        )
        if (cause instanceof UnknownNodeError) return err as BaseError
        return cause
    })()

    throw new EstimateUserOperationGasError(cause, {
        ...args
    })
}
