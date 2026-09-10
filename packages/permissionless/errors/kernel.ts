import { Errors } from "viem"
import type { Address } from "viem/utils"

export class KernelUnsupportedVersionError extends Errors.BaseError {
    override name = "KernelUnsupportedVersionError"

    constructor({
        version,
        entryPointVersion
    }: {
        version: string
        entryPointVersion: string
    }) {
        super(
            `Kernel ${version} is not available on EntryPoint ${entryPointVersion}.`
        )
    }
}

export class KernelValidatorAddressRequiredError extends Errors.BaseError {
    override name = "KernelValidatorAddressRequiredError"

    constructor({ version }: { version: string }) {
        super(
            `Kernel ${version} has no default validator for this owner type. Pass \`validatorAddress\`.`
        )
    }
}

export class KernelNonceKeyTooLargeError extends Errors.BaseError {
    override name = "KernelNonceKeyTooLargeError"

    constructor({ nonceKey, version }: { nonceKey: bigint; version: string }) {
        super(
            `Nonce key ${nonceKey} exceeds the 2-byte (maxUint16) user-key field of Kernel ${version}.`
        )
    }
}

export class KernelDecodeCallsError extends Errors.BaseError {
    override name = "KernelDecodeCallsError"

    constructor({ functionName }: { functionName: string }) {
        super(`Unable to decode calls for "${functionName}".`)
    }
}

export class InvalidKernelAccountError extends Errors.BaseError<
    Error | undefined
> {
    override name = "InvalidKernelAccountError"

    constructor({
        address,
        cause
    }: {
        address: Address.Address
        cause?: Error | undefined
    }) {
        super(`Contract at ${address} is not a Kernel account.`, { cause })
    }
}
