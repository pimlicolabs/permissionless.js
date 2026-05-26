import type { Client, Hex, Transport } from "viem"
import { describe, expect, test, vi } from "vitest"

import { writeContract } from "./writeContract"

vi.mock("viem", () => ({
    encodeFunctionData: () => "0x1000"
}))

vi.mock("viem/utils", () => ({
    getAction: () => async (parameters: { data: Hex }) => parameters.data
}))

describe("writeContract", () => {
    test("removes only the dataSuffix hex prefix", async () => {
        const data = await writeContract(
            {} as Client<Transport, undefined, undefined>,
            {
                abi: [],
                address: "0x0000000000000000000000000000000000000000",
                functionName: "setValue",
                args: [0x10n],
                dataSuffix: "0x10"
            }
        )

        expect(data).toBe("0x100010")
    })
})
