import { BaseError } from "viem"

export class AccountNotFoundError extends BaseError {
    constructor({ docsPath }: { docsPath?: string | undefined } = {}) {
        super(
            [
                "Could not find an Account to execute with this Action.",
                "Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client."
            ].join("\n"),
            {
                docsPath,
                docsSlug: "account",
                name: "AccountNotFoundError"
            }
        )
    }
}
