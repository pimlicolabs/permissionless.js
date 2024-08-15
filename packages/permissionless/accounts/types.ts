import { BaseError } from "viem"

export class SignTransactionNotSupportedBySmartAccount extends BaseError {
    override name = "SignTransactionNotSupportedBySmartAccount"
    constructor({ docsPath }: { docsPath?: string } = {}) {
        super(
            [
                "A smart account cannot sign or send transaction, it can only sign message or userOperation.",
                "Please send user operation instead."
            ].join("\n"),
            {
                docsPath,
                docsSlug: "account"
            }
        )
    }
}
