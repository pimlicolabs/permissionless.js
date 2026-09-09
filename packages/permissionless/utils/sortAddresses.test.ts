import type { Address } from "viem/utils"
import { describe, expect, test } from "vitest"
import { sortAddresses } from "./sortAddresses"

describe("sortAddresses", () => {
    test("should sort addresses in ascending byte-wise order", () => {
        const addresses: Address.Address[] = [
            "0xffffffffffffffffffffffffffffffffffffff03",
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01",
            "0xcccccccccccccccccccccccccccccccccccccc04",
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02"
        ]

        expect(sortAddresses(addresses)).toEqual([
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01",
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02",
            "0xcccccccccccccccccccccccccccccccccccccc04",
            "0xffffffffffffffffffffffffffffffffffffff03"
        ])
    })

    test("should ignore case when sorting", () => {
        const addresses: Address.Address[] = [
            "0xAb12000000000000000000000000000000000000",
            "0xaB58000000000000000000000000000000000000",
            "0x9F00000000000000000000000000000000000000"
        ]

        expect(sortAddresses(addresses)).toEqual([
            "0x9F00000000000000000000000000000000000000",
            "0xAb12000000000000000000000000000000000000",
            "0xaB58000000000000000000000000000000000000"
        ])
    })

    test("should not mutate the input array", () => {
        const addresses: Address.Address[] = [
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02",
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01"
        ]
        const copy = [...addresses]

        sortAddresses(addresses)

        expect(addresses).toEqual(copy)
    })

    test("should not depend on the host locale (da collation regression)", () => {
        // Under a Danish/Norwegian ICU collation the "aa" digraph sorts
        // after "z", so localeCompare would order 0xaaaa... last. The
        // byte-wise sort must keep it first regardless of locale.
        const addresses: Address.Address[] = [
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02",
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01",
            "0xab12000000000000000000000000000000000000"
        ]

        const sorted = sortAddresses(addresses)

        expect(sorted[0]).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01")

        // Only assert the divergence when the runtime ships full ICU.
        if (Intl.Collator.supportedLocalesOf("da").length > 0) {
            const daOrder = [...addresses].sort((left, right) =>
                new Intl.Collator("da").compare(
                    left.toLowerCase(),
                    right.toLowerCase()
                )
            )
            expect(daOrder).not.toEqual(sorted)
            expect(daOrder[daOrder.length - 1]).toBe(
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01"
            )
        }
    })
})
