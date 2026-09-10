import type { Client } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint, type UserOperation } from "viem/erc4337"
import { describe, expect, test } from "vitest"
import { pimlicoActions } from "./pimlico"

const entryPoint = { address: EntryPoint.addressV07, version: "0.7" } as const
const token = "0x0000000000000000000000000000000000000001"
const paymaster = "0x0000000000000000000000000000000000000002"

const userOperation = {
    sender: "0x0000000000000000000000000000000000000003",
    nonce: 0n,
    callData: "0x",
    callGasLimit: 100_000n,
    verificationGasLimit: 100_000n,
    preVerificationGas: 50_000n,
    maxFeePerGas: 2n,
    maxPriorityFeePerGas: 1n,
    signature: "0x"
} as UserOperation.UserOperation<"0.7">

const quote = {
    paymaster,
    token,
    postOpGas: "0x186a0", // 100_000
    exchangeRate: "0xde0b6b3a7640000", // 1e18
    exchangeRateNativeToUsd: "0x1bc16d674ec80000" // 2e18
}

const actions = (results: Record<string, unknown>) => {
    const calls: { method: string; params: unknown[] }[] = []
    const client = {
        chain: anvil,
        request: (async (call: { method: string; params: unknown[] }) => {
            calls.push(call)
            return results[call.method]
        }) as unknown as Client.Client["request"]
    }
    return { calls, ...pimlicoActions({ entryPoint })(client) }
}

describe("pimlicoActions", () => {
    test("getUserOperationGasPrice decodes all three tiers", async () => {
        const tier = { maxFeePerGas: "0x2", maxPriorityFeePerGas: "0x1" }
        const { getUserOperationGasPrice } = actions({
            pimlico_getUserOperationGasPrice: {
                slow: tier,
                standard: tier,
                fast: tier
            }
        })
        expect(await getUserOperationGasPrice()).toEqual({
            slow: { maxFeePerGas: 2n, maxPriorityFeePerGas: 1n },
            standard: { maxFeePerGas: 2n, maxPriorityFeePerGas: 1n },
            fast: { maxFeePerGas: 2n, maxPriorityFeePerGas: 1n }
        })
    })

    test("getUserOperationStatus forwards the hash", async () => {
        const status = { status: "included", transactionHash: "0xabc" }
        const { calls, getUserOperationStatus } = actions({
            pimlico_getUserOperationStatus: status
        })
        expect(await getUserOperationStatus({ hash: "0xdead" })).toEqual(status)
        expect(calls[0]).toEqual({
            method: "pimlico_getUserOperationStatus",
            params: ["0xdead"]
        })
    })

    test("sponsorUserOperation injects the client's entryPoint address", async () => {
        const { calls, sponsorUserOperation } = actions({
            pm_sponsorUserOperation: {
                callGasLimit: "0x1",
                verificationGasLimit: "0x2",
                preVerificationGas: "0x3",
                paymaster,
                paymasterVerificationGasLimit: "0x4",
                paymasterPostOpGasLimit: "0x5",
                paymasterData: "0x"
            }
        })
        const sponsored = await sponsorUserOperation({ userOperation })
        expect(sponsored.paymaster).toBe(paymaster)
        expect(sponsored.callGasLimit).toBe(1n)
        expect(calls[0]?.params[1]).toBe(entryPoint.address)
    })

    test("validateSponsorshipPolicies injects the entryPoint address", async () => {
        const { calls, validateSponsorshipPolicies } = actions({
            pm_validateSponsorshipPolicies: []
        })
        await validateSponsorshipPolicies({
            userOperation,
            sponsorshipPolicyIds: ["sp_shiny_puma"]
        })
        expect(calls[0]?.params[1]).toBe(entryPoint.address)
        expect(calls[0]?.params[2]).toEqual(["sp_shiny_puma"])
    })

    test("getTokenQuotes injects the entryPoint address and the client's chain", async () => {
        const { calls, getTokenQuotes } = actions({
            pimlico_getTokenQuotes: { quotes: [quote] }
        })
        const [decoded] = await getTokenQuotes({ tokens: [token] })
        expect(decoded?.postOpGas).toBe(100_000n)
        expect(decoded?.exchangeRate).toBe(10n ** 18n)
        expect(calls[0]).toEqual({
            method: "pimlico_getTokenQuotes",
            params: [{ tokens: [token] }, entryPoint.address, "0x7a69"]
        })
    })

    test("estimateErc20PaymasterCost prices the userOperation with the quote", async () => {
        const { estimateErc20PaymasterCost } = actions({
            pimlico_getTokenQuotes: { quotes: [quote] }
        })
        // (100_000 + 100_000 + 50_000) * 2 maxFeePerGas + 100_000 postOpGas * 2
        const maxCostInWei = 700_000n
        expect(
            await estimateErc20PaymasterCost({ userOperation, token })
        ).toEqual({
            costInToken: maxCostInWei,
            costInUsd: maxCostInWei * 2n
        })
    })
})
