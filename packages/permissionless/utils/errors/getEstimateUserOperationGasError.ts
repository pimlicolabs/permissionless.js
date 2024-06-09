import { type BaseError, UnknownNodeError } from "viem"
import type { EstimateUserOperationGasParameters } from "../../actions/bundler/estimateUserOperationGas"
import {
    EstimateUserOperationGasError,
    type EstimateUserOperationGasErrorType
} from "../../errors/estimateUserOperationGas"
import type { ErrorType } from "../../errors/utils"
import type { EntryPoint } from "../../types/entrypoint"
import {
    type GetBundlerErrorParameters,
    type GetBundlerErrorReturnType,
    getBundlerError
} from "./getBundlerError"

export type GetEstimateUserOperationGasErrorReturnType<
    entryPoint extends EntryPoint,
    cause = ErrorType
> = Omit<EstimateUserOperationGasErrorType<entryPoint>, "cause"> & {
    cause: cause | GetBundlerErrorReturnType
}

export function getEstimateUserOperationGasError<
    err extends ErrorType<string>,
    entryPoint extends EntryPoint
>(error: err, args: EstimateUserOperationGasParameters<entryPoint>) {
    const cause = (() => {
        const cause = getBundlerError(
            // biome-ignore lint/complexity/noBannedTypes: <explanation>
            error as {} as BaseError,
            args as GetBundlerErrorParameters<entryPoint>
        )
        // biome-ignore lint/complexity/noBannedTypes: <explanation>
        if (cause instanceof UnknownNodeError) return error as {} as BaseError
        return cause
    })()

    throw new EstimateUserOperationGasError(cause, {
        ...args
    }) as GetEstimateUserOperationGasErrorReturnType<entryPoint, err>
}
