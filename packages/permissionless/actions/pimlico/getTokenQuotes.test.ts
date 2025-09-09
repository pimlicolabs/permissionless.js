import { getAddress, isAddress } from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
import { foundry } from "viem/chains"
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

        const token = getAddress("0xffffffffffffffffffffffffffffffffffffffff")

        const quotes = await getTokenQuotes(pimlicoBundlerClient, {
            tokens: [token],
            entryPointAddress: entryPoint07Address,
            chain: foundry
        })

        expect(quotes).toBeTruthy()
        expect(Array.isArray(quotes)).toBe(true)
        expect(quotes[0].token).toBeTruthy()
        expect(isAddress(quotes[0].token))
        expect(quotes[0].token).toEqual(token)
        expect(quotes[0].paymaster).toBeTruthy()
        expect(isAddress(quotes[0].paymaster))
        expect(quotes[0].exchangeRate).toBeTruthy()
        expect(quotes[0].exchangeRate).toBeGreaterThan(0n)
        expect(quotes[0].postOpGas).toBeTruthy()
        expect(quotes[0].postOpGas).toBeGreaterThan(0n)
    })

    testWithRpc("getTokenQuotes v0.7", async ({ rpc }) => {
        const pimlicoBundlerClient = getPimlicoClient({
            entryPointVersion: "0.7",
            altoRpc: rpc.paymasterRpc
        })

        const token = getAddress("0xffffffffffffffffffffffffffffffffffffffff")

        const quotes = await getTokenQuotes(pimlicoBundlerClient, {
            tokens: [token],
            entryPointAddress: entryPoint07Address,
            chain: foundry
        })

        expect(quotes).toBeTruthy()
        expect(Array.isArray(quotes)).toBe(true)
        expect(quotes[0].token).toBeTruthy()
        expect(isAddress(quotes[0].token))
        expect(quotes[0].token).toEqual(token)
        expect(quotes[0].paymaster).toBeTruthy()
        expect(isAddress(quotes[0].paymaster))
        expect(quotes[0].exchangeRate).toBeTruthy()
        expect(quotes[0].exchangeRate).toBeGreaterThan(0n)
        expect(quotes[0].postOpGas).toBeTruthy()
        expect(quotes[0].postOpGas).toBeGreaterThan(0n)
    })

    testWithRpc("getTokenQuotes v0.8", async ({ rpc }) => {
        const pimlicoBundlerClient = getPimlicoClient({
            entryPointVersion: "0.8",
            altoRpc: rpc.paymasterRpc
        })

        const token = getAddress("0xffffffffffffffffffffffffffffffffffffffff")

        const quotes = await getTokenQuotes(pimlicoBundlerClient, {
            tokens: [token],
            entryPointAddress: entryPoint07Address,
            chain: foundry
        })

        expect(quotes).toBeTruthy()
        expect(Array.isArray(quotes)).toBe(true)
        expect(quotes[0].token).toBeTruthy()
        expect(isAddress(quotes[0].token))
        expect(quotes[0].token).toEqual(token)
        expect(quotes[0].paymaster).toBeTruthy()
        expect(isAddress(quotes[0].paymaster))
        expect(quotes[0].exchangeRate).toBeTruthy()
        expect(quotes[0].exchangeRate).toBeGreaterThan(0n)
        expect(quotes[0].postOpGas).toBeTruthy()
        expect(quotes[0].postOpGas).toBeGreaterThan(0n)
    })
})
