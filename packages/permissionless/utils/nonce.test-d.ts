import { Nonce } from "permissionless"
import { describe, expectTypeOf, test } from "vitest"

describe("Nonce", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof Nonce>().toEqualTypeOf<"decode" | "encode">()
    })

    test("encode / decode round trip on bigint key and sequence", () => {
        expectTypeOf(Nonce.encode).parameter(0).toEqualTypeOf<{
            key: bigint
            sequence: bigint
        }>()
        expectTypeOf(Nonce.encode).returns.toEqualTypeOf<bigint>()
        expectTypeOf(Nonce.decode).parameter(0).toEqualTypeOf<bigint>()
        expectTypeOf(Nonce.decode).returns.toEqualTypeOf<{
            key: bigint
            sequence: bigint
        }>()
        expectTypeOf(
            Nonce.decode(Nonce.encode({ key: 1n, sequence: 2n }))
        ).toEqualTypeOf<{
            key: bigint
            sequence: bigint
        }>()
        // @ts-expect-error keys are bigint
        Nonce.encode({ key: 1, sequence: 2n })
    })
})
