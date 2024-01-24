import { BaseError, ExecutionRevertedError, UnknownNodeError } from "viem"
import type { EstimateUserOperationGasParameters } from "../../actions/bundler/estimateUserOperationGas"
import { SmartAccountAlreadyDeployed } from "../../errors"

export function getEstimateUserOperationGasError(
    err: BaseError,
    args: EstimateUserOperationGasParameters
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

    if (SmartAccountAlreadyDeployed.message.test(message)) {
        return new SmartAccountAlreadyDeployed({
            cause: err,
            sender: args.userOperation.sender,
            docsPath:
                "https://docs.pimlico.io/bundler/reference/entrypoint-errors/aa10"
        })
    }

    return new UnknownNodeError({ cause: err })
}
