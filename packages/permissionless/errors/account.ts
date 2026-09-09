import { Errors } from "viem"

export class AccountNotFoundError extends Errors.BaseError {
    override name = "AccountNotFoundError"

    constructor({ docsPath }: { docsPath?: string | undefined } = {}) {
        super(
            [
                "Could not find an Account to execute with this Action.",
                "Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client."
            ].join("\n"),
            { docsPath }
        )
    }
}

export class EmptyCallsError extends Errors.BaseError {
    override name = "EmptyCallsError"

    constructor() {
        super("No calls to encode.")
    }
}
