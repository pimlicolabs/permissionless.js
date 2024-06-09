import { type BaseError, UnknownNodeError } from "viem"
import type { SendUserOperationParameters } from "../../actions/bundler/sendUserOperation"
import { SendUserOperationError } from "../../errors"
import type { EntryPoint } from "../../types/entrypoint"
import {
    type GetBundlerErrorParameters,
    getBundlerError
} from "./getBundlerError"

export function getSendUserOperationError<entryPoint extends EntryPoint>(
    err: BaseError,
    args: SendUserOperationParameters<entryPoint>
) {
    const cause = (() => {
        const cause = getBundlerError(
            err as BaseError,
            args as GetBundlerErrorParameters<entryPoint>
        )
        if (cause instanceof UnknownNodeError) return err as BaseError
        return cause
    })()

    throw new SendUserOperationError(cause, {
        ...args
    })
}
