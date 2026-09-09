import { EntryPoint } from "viem/erc4337"
import { describe, expect, test } from "vitest"
import { toEntryPoint } from "./toEntryPoint"

describe("toEntryPoint", () => {
    test.each([
        ["0.6", EntryPoint.abiV06, EntryPoint.addressV06],
        ["0.7", EntryPoint.abiV07, EntryPoint.addressV07],
        ["0.8", EntryPoint.abiV08, EntryPoint.addressV08],
        ["0.9", EntryPoint.abiV09, EntryPoint.addressV09]
    ] as const)(
        "resolves %s to the canonical abi and address",
        (version, abi, address) => {
            const entryPoint = toEntryPoint(version)
            expect(entryPoint.version).toBe(version)
            expect(entryPoint.address).toBe(address)
            expect(entryPoint.abi).toBe(abi)
        }
    )

    test("keeps a custom address and resolves the abi from the version", () => {
        const address = "0x1234567890123456789012345678901234567890"
        const entryPoint = toEntryPoint({ address, version: "0.7" })
        expect(entryPoint).toStrictEqual({
            abi: EntryPoint.abiV07,
            address,
            version: "0.7"
        })
    })
})
