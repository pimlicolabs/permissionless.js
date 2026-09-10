import { Errors } from "viem"

export class TransactionToRequiredError extends Errors.BaseError {
    override name = "TransactionToRequiredError"

    constructor() {
        super("`to` is required to send a transaction from a smart account.")
    }
}
