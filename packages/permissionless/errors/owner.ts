import { Errors } from "viem"

export class OwnerAddressRequiredError extends Errors.BaseError {
    override name = "OwnerAddressRequiredError"

    constructor() {
        super("The provider returned no accounts.", {
            metaMessages: [
                "Pass `address` alongside the provider, or connect an account first."
            ]
        })
    }
}

export class OwnerSignUnsupportedError extends Errors.BaseError {
    override name = "OwnerSignUnsupportedError"

    constructor() {
        super(
            "Owners built from a wallet client or EIP-1193 provider only sign messages and typed data."
        )
    }
}
