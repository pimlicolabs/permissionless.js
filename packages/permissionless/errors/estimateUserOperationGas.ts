import { BaseError } from "viem"
import type { EstimateUserOperationGasParameters } from "../actions/bundler/estimateUserOperationGas.js"
import { prettyPrint } from "./utils.js"

export type EstimateUserOperationGasErrorType =
    EstimateUserOperationGasError & {
        name: "EstimateUserOperationGasError"
    }
export class EstimateUserOperationGasError extends BaseError {
    override cause: BaseError

    override name = "EstimateUserOperationGasError"

    constructor(
        cause: BaseError,
        {
            userOperation,
            entryPoint,
            docsPath
        }: EstimateUserOperationGasParameters & {
            docsPath?: string
        }
    ) {
        const prettyArgs = prettyPrint({
            sender: userOperation.sender,
            nonce: userOperation.nonce,
            initCode: userOperation.initCode,
            callData: userOperation.callData,
            callGasLimit: userOperation.callGasLimit,
            verificationGasLimit: userOperation.verificationGasLimit,
            preVerificationGas: userOperation.preVerificationGas,
            maxFeePerGas: userOperation.maxFeePerGas,
            maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
            paymasterAndData: userOperation.paymasterAndData,
            signature: userOperation.signature,
            entryPoint
        })

        super(cause.shortMessage, {
            cause,
            docsPath,
            metaMessages: [
                ...(cause.metaMessages ? [...cause.metaMessages, " "] : []),
                "Estimate Gas Arguments:",
                prettyArgs
            ].filter(Boolean) as string[]
        })
        this.cause = cause
    }
}
