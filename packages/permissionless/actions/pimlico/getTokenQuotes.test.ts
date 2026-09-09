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
        expect(quotes[0].token).toBeTruthy()
        expect(Address.validate(quotes[0].token))
        expect(quotes[0].token).toEqual(token)
        expect(quotes[0].paymaster).toBeTruthy()
        expect(Address.validate(quotes[0].paymaster))
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
        expect(quotes[0].token).toBeTruthy()
        expect(Address.validate(quotes[0].token))
        expect(quotes[0].token).toEqual(token)
        expect(quotes[0].paymaster).toBeTruthy()
        expect(Address.validate(quotes[0].paymaster))
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
        expect(quotes[0].token).toBeTruthy()
        expect(Address.validate(quotes[0].token))
        expect(quotes[0].token).toEqual(token)
        expect(quotes[0].paymaster).toBeTruthy()
        expect(Address.validate(quotes[0].paymaster))
        expect(quotes[0].exchangeRate).toBeTruthy()
        expect(quotes[0].exchangeRate).toBeGreaterThan(0n)
        expect(quotes[0].postOpGas).toBeTruthy()
        expect(quotes[0].postOpGas).toBeGreaterThan(0n)
    })
})
