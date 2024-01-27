import { BaseError } from "viem"

export class VerificationGasLimitNotEnough extends BaseError {
    static message = /aa4[01]/
    override name = "VerificationGasLimitNotEnough"
    constructor({
        cause,
        verificationGasLimit,
        docsPath
    }: {
        cause?: BaseError
        verificationGasLimit?: bigint
        docsPath?: string
    }) {
        super(
            [
                `Smart account and paymaster verification exceeded the verificationGasLimit ${verificationGasLimit} set for the user operation.`,
                "",
                "Possible solutions:",
                "• Verify that the verificationGasLimit set for the user operation is high enough to cover the gas used during smart account and paymaster verification.",
                "• If you are using the eth_estimateUserOperationGas or pm_sponsorUserOperation method from bundler provider to set user operation gas limits and the EntryPoint throws this error during submission, reach out to them.",
                "",
                docsPath ? `Docs: ${docsPath}` : ""
            ].join("\n"),
            {
                cause
            }
        )
    }
}

export class FundsLowerThanActualGasCost extends BaseError {
    static message = /aa51/
    override name = "FundsLowerThanActualGasCost"
    constructor({
        cause,
        docsPath
    }: {
        cause?: BaseError
        docsPath?: string
    }) {
        super(
            [
                "The actual gas cost of the user operation ended up being higher than the funds paid by the smart account or the paymaster.",
                "",
                "Possible solutions:",
                "• If you encounter this error, try increasing the verificationGasLimit set for the user operation.",
                "• If you are using the eth_estimateUserOperationGas or pm_sponsorUserOperation method from bundler provider to set user operation gas limits and the EntryPoint throws this error during submission, reach out to them.",
                "",
                docsPath ? `Docs: ${docsPath}` : ""
            ].join("\n"),
            {
                cause
            }
        )
    }
}

export class GasValuesOverFlow extends BaseError {
    static message = /aa94/
    override name = "GasValuesOverFlow"
    constructor({
        cause,
        docsPath
    }: {
        cause?: BaseError
        docsPath?: string
    }) {
        super(
            [
                "The gas limit values of the user operation overflowed, they must fit in uint160.",
                "",
                docsPath ? `Docs: ${docsPath}` : ""
            ].join("\n"),
            {
                cause
            }
        )
    }
}

export class OutOfGas extends BaseError {
    static message = /aa95/
    override name = "OutOfGas"
    constructor({
        cause,
        docsPath
    }: {
        cause?: BaseError
        docsPath?: string
    }) {
        super(
            [
                "The bundler tried to bundle the user operation with the gas limit set too low.",
                "",
                "Possible solutions:",
                "• If you are using your own bundler, configure it send gas limits properly.",
                "• If you are using a bundler provider, reach out to them.",
                "",
                docsPath ? `Docs: ${docsPath}` : ""
            ].join("\n"),
            {
                cause
            }
        )
    }
}
