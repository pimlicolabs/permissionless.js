import { anvil } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { describe, expect, test } from "vitest"
import { TokenQuoteNotFoundError } from "../../errors/erc20Paymaster"
import { estimateCost } from "./estimateCost"

describe("estimateCost", () => {
    test("rejects with TokenQuoteNotFoundError when no quote is returned", async () => {
        const client = { chain: anvil, request: async () => ({ quotes: [] }) }
        await expect(
            estimateCost(client as any, {
                entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
                token: "0x0000000000000000000000000000000000000001",
                userOperation: {} as any
            })
        ).rejects.toThrow(TokenQuoteNotFoundError)
    })
})
