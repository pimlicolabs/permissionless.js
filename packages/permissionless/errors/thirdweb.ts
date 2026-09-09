import { Errors } from "viem"

export class ThirdwebNoCallsError extends Errors.BaseError {
    override name = "ThirdwebNoCallsError"

    constructor() {
        super("No calls to encode.")
    }
}
