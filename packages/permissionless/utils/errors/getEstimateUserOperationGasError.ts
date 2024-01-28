import { BaseError, UnknownNodeError } from "viem"
import type { EstimateUserOperationGasParameters } from "../../actions/bundler/estimateUserOperationGas"
import {
    EstimateUserOperationGasError,
    type EstimateUserOperationGasErrorType
} from "../../errors/estimateUserOperationGas"
import { type ErrorType } from "../../errors/utils"
import {
    type GetBundlerErrorParameters,
    type GetBundlerErrorReturnType,
    getBundlerError
} from "./getBundlerError"

export type GetEstimateUserOperationGasErrorReturnType<cause = ErrorType> =
    Omit<EstimateUserOperationGasErrorType, "cause"> & {
        cause: cause | GetBundlerErrorReturnType
    }

export function getEstimateUserOperationGasError<err extends ErrorType<string>>(
    error: err,
    args: EstimateUserOperationGasParameters
) {
    const cause = (() => {
        const cause = getBundlerError(
            // biome-ignore lint/complexity/noBannedTypes: <explanation>
            error as {} as BaseError,
            args as GetBundlerErrorParameters
        )
        // biome-ignore lint/complexity/noBannedTypes: <explanation>
        if (cause instanceof UnknownNodeError) return error as {} as BaseError
        return cause
    })()

    throw new EstimateUserOperationGasError(cause, {
        ...args
    }) as GetEstimateUserOperationGasErrorReturnType<err>
}
