import { Chain, type Client } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint, type UserOperation } from "viem/erc4337"
import { describe, expect, test } from "vitest"
import { TokenQuoteNotFoundError } from "../../errors/erc20Paymaster"
import { estimateCost } from "./estimateCost"

const token = "0x0000000000000000000000000000000000000001"
const entryPoint = { address: EntryPoint.addressV07, version: "0.7" } as const

const client = <chain extends Chain.Chain | undefined>(
    quotes: unknown[],
    chain: chain
): Pick<Client.Client<chain>, "chain" | "request"> => ({
    chain,
    // canned pimlico_getTokenQuotes result; the action only calls `request`
    request: (async () => ({ quotes })) as unknown as Client.Client["request"]
})

const quote = {
    paymaster: "0x0000000000000000000000000000000000000002",
    token,
    postOpGas: "0x186a0", // 100_000
    exchangeRate: "0x1bc16d674ec80000", // 2e18
    exchangeRateNativeToUsd: "0x6f05b59d3b20000" // 5e17
}

const userOperation = {
    callGasLimit: 100_000n,
    verificationGasLimit: 100_000n,
    preVerificationGas: 50_000n,
    maxFeePerGas: 2n
} as UserOperation.UserOperation<"0.7">

describe("estimateCost", () => {
    test("rejects with TokenQuoteNotFoundError when no quote is returned", async () => {
        await expect(
            estimateCost(client([], anvil), {
                entryPoint,
                token,
                userOperation: {} as UserOperation.UserOperation<"0.7">
            })
        ).rejects.toThrow(TokenQuoteNotFoundError)
    })

    test("rejects when neither the client nor the call carries a chain", async () => {
        await expect(
            estimateCost(client([], undefined), {
                chain: undefined,
                entryPoint,
                token,
                userOperation
            })
        ).rejects.toThrow(Chain.NotFoundError)
    })

    test("prices the prefund plus postOpGas at the quoted rates", async () => {
        // (100_000 + 100_000 + 50_000) * 2 maxFeePerGas + 100_000 postOpGas * 2
        // = 700_000 wei, priced at the quote's two exchange rates
        expect(
            await estimateCost(client([quote], anvil), {
                entryPoint,
                token,
                userOperation
            })
        ).toEqual({ costInToken: 1_400_000n, costInUsd: 350_000n })
    })
})
