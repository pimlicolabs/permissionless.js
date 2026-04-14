import { encodeFunctionData, erc20Abi, zeroAddress } from "viem"
import { describe, expect, test } from "vitest"
import { decode7579Calls } from "./decode7579Calls"
import { encode7579Calls } from "./encode7579Calls"

describe("decode7579Calls", () => {
    test("roundtrip single call", () => {
        const callData = encode7579Calls({
            mode: {
                type: "call"
            },
            callData: [
                {
                    to: "0x1234567890123456789012345678901234567890",
                    value: 12345n,
                    data: "0xdeadbeef"
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.mode.type).toBe("call")
        expect(decoded.callData).toHaveLength(1)
        expect(decoded.callData[0].to).toBe(
            "0x1234567890123456789012345678901234567890"
        )
        expect(decoded.callData[0].value).toBe(12345n)
        expect(decoded.callData[0].data).toBe("0xdeadbeef")
    })

    test("roundtrip batch call", () => {
        const callData = encode7579Calls({
            mode: {
                type: "batchcall"
            },
            callData: [
                {
                    to: "0x1234567890123456789012345678901234567890",
                    value: 100n,
                    data: "0xaa"
                },
                {
                    to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
                    value: 200n,
                    data: "0xbb"
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.mode.type).toBe("batchcall")
        expect(decoded.callData).toHaveLength(2)
        expect(decoded.callData[0].to).toBe(
            "0x1234567890123456789012345678901234567890"
        )
        expect(decoded.callData[0].value).toBe(100n)
        expect(decoded.callData[1].to.toLowerCase()).toBe(
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        )
        expect(decoded.callData[1].value).toBe(200n)
    })

    test("roundtrip delegatecall", () => {
        const callData = encode7579Calls({
            mode: {
                type: "delegatecall"
            },
            callData: [
                {
                    to: "0x1234567890123456789012345678901234567890",
                    value: 0n,
                    data: "0x1234"
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.mode.type).toBe("delegatecall")
        expect(decoded.callData).toHaveLength(1)
    })

    test("single call with empty data", () => {
        const callData = encode7579Calls({
            mode: {
                type: "call"
            },
            callData: [
                {
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.mode.type).toBe("call")
        expect(decoded.callData[0].to).toBe(zeroAddress)
        expect(decoded.callData[0].value).toBe(0n)
        expect(decoded.callData[0].data).toBe("0x")
    })

    test("revertOnError flag roundtrip", () => {
        const callData = encode7579Calls({
            mode: {
                type: "call",
                revertOnError: true
            },
            callData: [
                {
                    to: "0x1234567890123456789012345678901234567890",
                    value: 0n,
                    data: "0x"
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.mode.revertOnError).toBe(true)
    })

    test("single call with ERC-20 transfer data", () => {
        const erc20TransferData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [zeroAddress, 1000000000000000000n]
        })

        const callData = encode7579Calls({
            mode: {
                type: "call"
            },
            callData: [
                {
                    to: "0x1234567890123456789012345678901234567890",
                    value: 0n,
                    data: erc20TransferData
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.callData[0].data).toBe(erc20TransferData)
    })

    test("batch call with ERC-20 transfer data", () => {
        const erc20TransferData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [zeroAddress, 1000000000000000000n]
        })

        const callData = encode7579Calls({
            mode: {
                type: "batchcall"
            },
            callData: [
                {
                    to: "0x1234567890123456789012345678901234567890",
                    value: 0n,
                    data: erc20TransferData
                },
                {
                    to: zeroAddress,
                    value: 500n,
                    data: "0x"
                }
            ]
        })

        const decoded = decode7579Calls(callData)

        expect(decoded.callData[0].data).toBe(erc20TransferData)
        expect(decoded.callData[1].value).toBe(500n)
    })

    test("throws on invalid calldata", () => {
        expect(() => decode7579Calls("0xdeadbeef")).toThrow()
    })
})
