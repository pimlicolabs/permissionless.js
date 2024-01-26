import { BaseError, UnknownNodeError } from "viem"
import type { EstimateUserOperationGasParameters } from "../../actions/bundler/estimateUserOperationGas"
import { EstimateUserOperationGasError } from "../../errors"
import {
    type GetBundlerErrorParameters,
    getBundlerError
} from "./getBundlerError"

export function getEstimateUserOperationGasError(
    err: BaseError,
    args: EstimateUserOperationGasParameters
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
