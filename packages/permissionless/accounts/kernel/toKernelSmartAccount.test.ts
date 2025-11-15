import { describe, expect, test } from "vitest"
import { createPublicClient, http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { toKernelSmartAccount } from "./toKernelSmartAccount"

describe("Kernel Smart Account - Strict Validation", () => {
    test("creates account with strictValidation disabled by default", async () => {
        const owner = privateKeyToAccount(generatePrivateKey())
        const publicClient = createPublicClient({
            chain: sepolia,
            transport: http()
        })

        const account = await toKernelSmartAccount({
            client: publicClient,
            owners: [owner],
            index: 0n
        })

        expect(account.strictValidation).toBe(false)
    })

    test("creates account with strictValidation enabled", async () => {
        const owner = privateKeyToAccount(generatePrivateKey())
        const publicClient = createPublicClient({
            chain: sepolia,
            transport: http()
        })

        const account = await toKernelSmartAccount({
            client: publicClient,
            owners: [owner],
            index: 0n,
            strictValidation: true
        })

        expect(account.strictValidation).toBe(true)
    })

    test("strictValidation property is accessible on account", async () => {
        const owner = privateKeyToAccount(generatePrivateKey())
        const publicClient = createPublicClient({
            chain: sepolia,
            transport: http()
        })

        const accountWithoutStrict = await toKernelSmartAccount({
            client: publicClient,
            owners: [owner],
            index: 0n
        })

        const accountWithStrict = await toKernelSmartAccount({
            client: publicClient,
            owners: [owner],
            index: 1n,
            strictValidation: true
        })

        expect("strictValidation" in accountWithoutStrict).toBe(true)
        expect("strictValidation" in accountWithStrict).toBe(true)
        expect(accountWithoutStrict.strictValidation).toBe(false)
        expect(accountWithStrict.strictValidation).toBe(true)
    })
})
