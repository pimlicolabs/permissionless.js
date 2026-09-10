import { Errors } from "viem"
import type { Address } from "viem/utils"

export class InvalidEntryPointError extends Errors.BaseError<
    Errors.BaseError | undefined
> {
    override name = "InvalidEntryPointError"

    constructor({
        cause,
        entryPointAddress
    }: {
        cause?: Errors.BaseError
        entryPointAddress?: Address.Address
    } = {}) {
        super(
            `The entry point address (\`entryPoint\`${
                entryPointAddress ? ` = ${entryPointAddress}` : ""
            }) is not a valid entry point. getSenderAddress did not revert with a SenderAddressResult error.`,
            {
                cause
            }
        )
    }
}

export class InitCodeRequiredError extends Errors.BaseError {
    override name = "InitCodeRequiredError"

    constructor() {
        super("Either `initCode` or `factory` and `factoryData` is required.")
    }
}

export class SenderAddressNotFoundError extends Errors.BaseError {
    override name = "SenderAddressNotFoundError"

    constructor({ entryPointAddress }: { entryPointAddress: Address.Address }) {
        super(
            `getSenderAddress on EntryPoint ${entryPointAddress} returned no data.`
        )
    }
}
