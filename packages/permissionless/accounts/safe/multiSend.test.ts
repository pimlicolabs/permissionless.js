import {
    encodeFunctionData,
    encodePacked,
    erc20Abi,
    maxUint256,
    zeroAddress
} from "viem"
import { describe, expect, test } from "vitest"
import {
    type MultiSendTransaction,
    decodeMultiSend,
    encodeMultiSend,
    multiSendAbi
} from "./multiSend"

const erc20TransactionData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [zeroAddress, 1000000000000000000n]
})

const encodeRawMultiSend = (transactions: `0x${string}`) =>
    encodeFunctionData({
        abi: multiSendAbi,
        functionName: "multiSend",
        args: [transactions]
    })

describe("multiSend", () => {
    test("round-trips calls with and without data in every position", () => {
        const transactions: MultiSendTransaction[] = [
            {
                to: "0x1111111111111111111111111111111111111111",
                data: "0x",
                value: 1n,
                operation: 0
            },
            {
                to: "0x2222222222222222222222222222222222222222",
                data: erc20TransactionData,
                value: 0n,
                operation: 0
            },
            {
                to: "0x3333333333333333333333333333333333333333",
                data: "0x",
                value: 0n,
                operation: 1
            },
            {
                to: "0x4444444444444444444444444444444444444444",
                data: "0xdeadbeef",
                value: 10n,
                operation: 0
            },
            {
                to: "0x5555555555555555555555555555555555555555",
                data: "0x",
                value: 2n,
                operation: 0
            }
        ]

        expect(decodeMultiSend(encodeMultiSend(transactions))).toEqual(
            transactions
        )
    })

    test("round-trips a batch of calls without data", () => {
        const transactions: MultiSendTransaction[] = [
            {
                to: "0x1111111111111111111111111111111111111111",
                data: "0x",
                value: 1n,
                operation: 0
            },
            {
                to: "0x2222222222222222222222222222222222222222",
                data: "0x",
                value: 2n,
                operation: 0
            }
        ]

        expect(decodeMultiSend(encodeMultiSend(transactions))).toEqual(
            transactions
        )
    })

    test("returns checksummed addresses", () => {
        const [transaction] = decodeMultiSend(
            encodeMultiSend([
                {
                    to: "0xa83c336b20401af773b6219ba5027174338d1836",
                    data: "0x",
                    value: 0n,
                    operation: 0
                }
            ])
        )

        expect(transaction?.to).toBe(
            "0xA83c336B20401Af773B6219BA5027174338D1836"
        )
    })

    test("throws when the data is shorter than its declared length", () => {
        const callData = encodeRawMultiSend(
            encodePacked(
                ["uint8", "address", "uint256", "uint256", "bytes"],
                [0, zeroAddress, 0n, 4n, "0xdead"]
            )
        )

        expect(() => decodeMultiSend(callData)).toThrow(
            "Invalid MultiSend data: transaction data is out of bounds"
        )
    })

    test("throws when a transaction header is truncated", () => {
        const callData = encodeRawMultiSend(
            encodePacked(["uint8", "address"], [0, zeroAddress])
        )

        expect(() => decodeMultiSend(callData)).toThrow(
            "Invalid MultiSend data: transaction header is out of bounds"
        )
    })

    test("throws when the declared length is not a safe integer", () => {
        const callData = encodeRawMultiSend(
            encodePacked(
                ["uint8", "address", "uint256", "uint256"],
                [0, zeroAddress, 0n, maxUint256]
            )
        )

        expect(() => decodeMultiSend(callData)).toThrow()
    })

    test("throws on an unknown operation", () => {
        const callData = encodeRawMultiSend(
            encodePacked(
                ["uint8", "address", "uint256", "uint256"],
                [2, zeroAddress, 0n, 0n]
            )
        )

        expect(() => decodeMultiSend(callData)).toThrow(
            "Invalid MultiSend data: unknown operation 2"
        )
    })

    test("throws on odd-length call data", () => {
        expect(() =>
            encodeMultiSend([
                {
                    to: zeroAddress,
                    data: "0xabc",
                    value: 0n,
                    operation: 0
                }
            ])
        ).toThrow("hex string must have an even number of characters")
    })
})
