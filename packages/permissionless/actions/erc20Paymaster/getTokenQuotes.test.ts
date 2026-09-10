import { anvil } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { Address } from "viem/utils"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getPimlicoClient } from "../../../permissionless-test/src/utils"
import { getTokenQuotes } from "./getTokenQuotes"

describe("getTokenQuotes", () => {
    testWithRpc("getTokenQuotes v0.6", async ({ rpc }) => {
        const pimlicoBundlerClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: rpc.paymasterRpc
        })

        const token = Address.checksum(
            "0xffffffffffffffffffffffffffffffffffffffff"
        )

        const quotes = await getTokenQuotes(pimlicoBundlerClient, {
            tokens: [token],
            entryPointAddress: EntryPoint.addressV07,
            chain: anvil
        })

        expect(quotes).toBeTruthy()
        expect(Array.isArray(quotes)).toBe(true)
        const quote = quotes[0]
        if (!quote) throw new Error("no quote returned")
        expect(quote.token).toBeTruthy()
        expect(Address.validate(quote.token))
        expect(quote.token).toEqual(token)
        expect(quote.paymaster).toBeTruthy()
        expect(Address.validate(quote.paymaster))
        expect(quote.exchangeRate).toBeTruthy()
        expect(quote.exchangeRate).toBeGreaterThan(0n)
        expect(quote.postOpGas).toBeTruthy()
        expect(quote.postOpGas).toBeGreaterThan(0n)
    })

    testWithRpc("getTokenQuotes v0.7", async ({ rpc }) => {
        const pimlicoBundlerClient = getPimlicoClient({
            entryPointVersion: "0.7",
            altoRpc: rpc.paymasterRpc
        })

        const token = Address.checksum(
            "0xffffffffffffffffffffffffffffffffffffffff"
        )

        const quotes = await getTokenQuotes(pimlicoBundlerClient, {
            tokens: [token],
            entryPointAddress: EntryPoint.addressV07,
            chain: anvil
        })

        expect(quotes).toBeTruthy()
        expect(Array.isArray(quotes)).toBe(true)
        const quote = quotes[0]
        if (!quote) throw new Error("no quote returned")
        expect(quote.token).toBeTruthy()
        expect(Address.validate(quote.token))
        expect(quote.token).toEqual(token)
        expect(quote.paymaster).toBeTruthy()
        expect(Address.validate(quote.paymaster))
        expect(quote.exchangeRate).toBeTruthy()
        expect(quote.exchangeRate).toBeGreaterThan(0n)
        expect(quote.postOpGas).toBeTruthy()
        expect(quote.postOpGas).toBeGreaterThan(0n)
    })

    testWithRpc("getTokenQuotes v0.8", async ({ rpc }) => {
        const pimlicoBundlerClient = getPimlicoClient({
            entryPointVersion: "0.8",
            altoRpc: rpc.paymasterRpc
        })

        const token = Address.checksum(
            "0xffffffffffffffffffffffffffffffffffffffff"
        )

        const quotes = await getTokenQuotes(pimlicoBundlerClient, {
            tokens: [token],
            entryPointAddress: EntryPoint.addressV07,
            chain: anvil
        })

        expect(quotes).toBeTruthy()
        expect(Array.isArray(quotes)).toBe(true)
        const quote = quotes[0]
        if (!quote) throw new Error("no quote returned")
        expect(quote.token).toBeTruthy()
        expect(Address.validate(quote.token))
        expect(quote.token).toEqual(token)
        expect(quote.paymaster).toBeTruthy()
        expect(Address.validate(quote.paymaster))
        expect(quote.exchangeRate).toBeTruthy()
        expect(quote.exchangeRate).toBeGreaterThan(0n)
        expect(quote.postOpGas).toBeTruthy()
        expect(quote.postOpGas).toBeGreaterThan(0n)
    })
})
