import { describe, expect, test } from "vitest"
import { decode7579Calls } from "./decode7579Calls"
import { encode7579Calls } from "./encode7579Calls"

describe("decode7579Calls", () => {
    test("decodes selector and context from the ERC-7579 mode layout", () => {
        const mode = {
            type: "call",
            revertOnError: true,
            selector: "0xdeadbeef",
            context: "0x11223344556677889900aabbccddeeff001122334455"
        } as const
        const callData = [
            {
                to: "0x1234567890123456789012345678901234567890",
                value: 12345n,
                data: "0xabcdef"
            }
        ] as const

        const decoded = decode7579Calls(encode7579Calls({ mode, callData }))

        expect(decoded.mode).toEqual(mode)
        expect(decoded.callData).toEqual(callData)
    })

    test("decodes zeroed mode fields with their spec sizes", () => {
        const decoded = decode7579Calls(
            encode7579Calls({
                mode: { type: "batchcall" },
                callData: [
                    { to: "0x1234567890123456789012345678901234567890" },
                    { to: "0x1234567890123456789012345678901234567890" }
                ]
            })
        )

        expect(decoded.mode).toEqual({
            type: "batchcall",
            revertOnError: false,
            selector: "0x00000000",
            context: `0x${"00".repeat(22)}`
        })
    })
})
