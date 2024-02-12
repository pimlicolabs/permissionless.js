import { BaseError, UnknownNodeError } from "viem"
import type { SendUserOperationParameters } from "../../actions/bundler/sendUserOperation"
import { SendUserOperationError } from "../../errors"
import type { DefaultEntryPoint, EntryPoint } from "../../types/entrypoint"
import {
    type GetBundlerErrorParameters,
    getBundlerError
} from "./getBundlerError"

export function getSendUserOperationError<
    entryPoint extends EntryPoint = DefaultEntryPoint
>(err: BaseError, args: SendUserOperationParameters<entryPoint>) {
    const cause = (() => {
        const cause = getBundlerError(
            err as BaseError,
            args as GetBundlerErrorParameters
        )
        if (cause instanceof UnknownNodeError) return err as BaseError
        return cause
    })()

    throw new SendUserOperationError(cause, {
        ...args
    })
}
