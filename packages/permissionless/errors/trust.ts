import { Errors } from "viem"
import type { Hex } from "viem/utils"

export class TrustEmptyCallsError extends Errors.BaseError {
    override name = "TrustEmptyCallsError"

    constructor() {
        super("No calls to encode.")
    }
}

export class TrustInvalidCallDataError extends Errors.BaseError {
    override name = "TrustInvalidCallDataError"

    constructor({ selector }: { selector: Hex.Hex }) {
        super(
            `Unable to decode Trust account call data (selector ${selector}).`
        )
    }
}
