import { BaseError } from "viem"
import { describe, expect, test } from "vitest"
import { AccountNotFoundError } from "./index"

describe("AccountNotFoundError", () => {
    test("default error message", () => {
        const error = new AccountNotFoundError()
        expect(error.message).toContain("Could not find an Account")
    })

    test("contains action guidance in message", () => {
        const error = new AccountNotFoundError()
        expect(error.message).toContain("account")
    })

    test("with docsPath", () => {
        const error = new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
        expect(error.message).toContain("Could not find an Account")
    })

    test("is instance of BaseError", () => {
        const error = new AccountNotFoundError()
        expect(error).toBeInstanceOf(BaseError)
    })

    test("has correct name", () => {
        const error = new AccountNotFoundError()
        expect(error.name).toBe("AccountNotFoundError")
    })
})
