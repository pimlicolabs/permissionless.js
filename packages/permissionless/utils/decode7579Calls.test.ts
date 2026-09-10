import { Abi, AbiFunction, Hex } from "viem/utils"
import { describe, expect, test } from "vitest"
import { Erc7579InvalidCallTypeError } from "../errors/erc7579"
import { decode7579Calls } from "./decode7579Calls"
import { encode7579Calls } from "./encode7579Calls"

const to = "0x1234567890123456789012345678901234567890"
const execute = AbiFunction.fromAbi(
    Abi.from([
        "function execute(bytes32 execMode, bytes executionCalldata) payable"
    ]),
    "execute"
)

describe("decode7579Calls", () => {
    test("round-trips a single call", () => {
        const call = { to, value: 12345n, data: "0xdeadbeef" } as const
        const { mode, callData } = decode7579Calls(
            encode7579Calls({ mode: { type: "call" }, callData: [call] })
        )
        expect(mode.type).toBe("call")
        expect(callData).toEqual([call])
    })

    test("round-trips a batch", () => {
        const calls = [
            { to, value: 1n, data: "0xdeadbeef" },
            { to, value: 0n, data: "0x" }
        ] as const
        const { mode, callData } = decode7579Calls(
            encode7579Calls({ mode: { type: "batchcall" }, callData: calls })
        )
        expect(mode.type).toBe("batchcall")
        expect(callData).toEqual(calls)
    })

    test("throws Erc7579InvalidCallTypeError for an unknown call type", () => {
        const data = AbiFunction.encodeData(execute, [
            Hex.padRight("0x02", 32),
            "0x"
        ])
        expect(() => decode7579Calls(data)).toThrow(Erc7579InvalidCallTypeError)
    })
})
