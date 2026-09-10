import type { Client } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint, type UserOperation } from "viem/erc4337"
import { describe, expect, test } from "vitest"
import { TokenQuoteNotFoundError } from "../../errors/erc20Paymaster"
import { estimateCost } from "./estimateCost"

describe("estimateCost", () => {
    test("rejects with TokenQuoteNotFoundError when no quote is returned", async () => {
        const client: Pick<Client.Client<typeof anvil>, "chain" | "request"> = {
            chain: anvil,
            // canned pimlico_getTokenQuotes result; the action only calls `request`
            request: (async () => ({
                quotes: []
            })) as unknown as Client.Client["request"]
        }
        await expect(
            estimateCost(client, {
                entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
                token: "0x0000000000000000000000000000000000000001",
                userOperation: {} as UserOperation.UserOperation<"0.7">
            })
        ).rejects.toThrow(TokenQuoteNotFoundError)
    })
})
