import { Errors } from "viem"

export class InvalidPasskeyServerResponseError extends Errors.BaseError {
    override name = "InvalidPasskeyServerResponseError"

    constructor({ method, reason }: { method: string; reason: string }) {
        super(`Invalid response from the passkey server for \`${method}\`.`, {
            metaMessages: [reason]
        })
    }
}

export class InvalidPasskeyCredentialError extends Errors.BaseError {
    override name = "InvalidPasskeyCredentialError"

    constructor({ field }: { field: string }) {
        super(`\`${field}\` not found in the credential response.`)
    }
}

export class PasskeyAttestationUnsupportedError extends Errors.BaseError<
    Error | undefined
> {
    override name = "PasskeyAttestationUnsupportedError"

    constructor({
        method,
        cause
    }: {
        method: string
        cause?: Error | undefined
    }) {
        super(
            `\`${method}()\` is not supported by this attestation response.`,
            {
                cause
            }
        )
    }
}
