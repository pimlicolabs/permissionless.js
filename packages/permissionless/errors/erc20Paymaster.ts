import { Errors } from "viem"
import type { Address } from "viem/utils"

export class TokenQuoteNotFoundError extends Errors.BaseError {
    override name = "TokenQuoteNotFoundError"

    constructor({ token }: { token: Address.Address }) {
        super(`No token quote found for ${token}.`, {
            metaMessages: ["Check that the paymaster supports this token."]
        })
    }
}

export class BalanceSlotRequiredError extends Errors.BaseError {
    override name = "BalanceSlotRequiredError"

    constructor({ token }: { token: Address.Address }) {
        super(`\`balanceOverride\` is not supported for token ${token}.`, {
            metaMessages: [
                "Pass `balanceSlot` to override the balance and allowance storage."
            ]
        })
    }
}

export class Erc20PaymasterRequiredError extends Errors.BaseError {
    override name = "Erc20PaymasterRequiredError"

    constructor() {
        super("Cannot sponsor an ERC-20 user operation without a paymaster.", {
            metaMessages: [
                "Pass `paymaster` to the client or to the user operation."
            ]
        })
    }
}
