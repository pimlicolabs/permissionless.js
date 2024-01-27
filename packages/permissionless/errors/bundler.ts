import { BaseError } from "viem"

export class InvalidBeneficiaryAddress extends BaseError {
    static message = /aa9[01]/
    override name = "InvalidBeneficiaryAddress"
    constructor({
        cause,
        docsPath
    }: {
        cause?: BaseError
        docsPath?: string
    }) {
        super(
            [
                "The bundler did not set a beneficiary address when bundling the user operation.",
                "",
                "Possible solutions:",
                "• If you encounter this error when running self-hosted bundler, make sure you have configured the bundler correctly.",
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

export class InvalidAggregator extends BaseError {
    static message = /aa96/
    override name = "InvalidAggregator"
    constructor({
        cause,
        docsPath
    }: {
        cause?: BaseError
        docsPath?: string
    }) {
        super(
            [
                "The bundler tried to bundle the user operation with an invalid aggregator.",
                "",
                "Possible solutions:",
                "• If you are using your own bundler, configure it to use a valid aggregator.",
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
