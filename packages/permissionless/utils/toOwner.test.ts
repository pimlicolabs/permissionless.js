import { describe, expect, test } from "vitest"
import {
    OwnerAddressRequiredError,
    OwnerSignUnsupportedError
} from "../errors/owner"
import { toOwner } from "./toOwner"

const address = "0x0000000000000000000000000000000000000001"
const provider = { request: async () => [] }

describe("toOwner", () => {
    test("rejects with OwnerAddressRequiredError when the provider has no accounts", async () => {
        await expect(toOwner({ owner: provider })).rejects.toThrow(
            OwnerAddressRequiredError
        )
    })

    test("provider owners only sign messages and typed data", async () => {
        const owner = await toOwner({ owner: provider, address })
        expect(owner.address).toBe(address)
        expect(() => owner.sign({ hash: "0x" })).toThrow(
            OwnerSignUnsupportedError
        )
    })
})
