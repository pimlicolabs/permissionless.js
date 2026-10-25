import {
    http,
    type Address,
    createPublicClient,
    encodeFunctionData,
    erc20Abi,
    parseAbi,
    zeroAddress
} from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect, test } from "vitest"
import { encodeMultiSend } from "./multiSend"
import { toSafeSmartAccount } from "./toSafeSmartAccount"

// With a known address, encodeCalls/decodeCalls don't hit the RPC for
// non-7579 Safes
const client = createPublicClient({
    chain: foundry,
    transport: http("http://127.0.0.1:1")
})

const executeUserOpWithErrorStringAbi = parseAbi([
    "function executeUserOpWithErrorString(address to, uint256 value, bytes data, uint8 operation)"
])

const multiSendCallOnlyAddress = "0xA83c336B20401Af773B6219BA5027174338D1836"

const erc20TransactionData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [zeroAddress, 1000000000000000000n]
})

const getSafeAccount = (callOnlyAddress: Address) =>
    toSafeSmartAccount({
        client,
        address: "0x9999999999999999999999999999999999999999",
        owners: [privateKeyToAccount(generatePrivateKey())],
        version: "1.4.1",
        entryPoint: {
            address: entryPoint07Address,
            version: "0.7"
        },
        multiSendCallOnlyAddress: callOnlyAddress
    })

describe("toSafeSmartAccount decodeCalls", () => {
    test("decodes batches when multiSendCallOnlyAddress is not checksummed", async () => {
        const account = await getSafeAccount(
            multiSendCallOnlyAddress.toLowerCase() as Address
        )

        const calls = [
            {
                to: "0x1111111111111111111111111111111111111111",
                data: erc20TransactionData,
                value: 0n
            },
            {
                to: "0x2222222222222222222222222222222222222222",
                data: "0x",
                value: 1n
            }
        ] as const

        const decoded = await account.decodeCalls?.(
            await account.encodeCalls([...calls])
        )

        expect(decoded).toEqual(calls)
    })

    test("decodes a single call to MultiSendCallOnly as one call", async () => {
        const account = await getSafeAccount(multiSendCallOnlyAddress)

        const call = {
            to: multiSendCallOnlyAddress,
            data: encodeMultiSend([
                {
                    to: "0x1111111111111111111111111111111111111111",
                    data: "0x",
                    value: 0n,
                    operation: 0
                }
            ]),
            value: 0n
        } as const

        const decoded = await account.decodeCalls?.(
            await account.encodeCalls([call])
        )

        expect(decoded).toEqual([call])
    })

    test("throws on a delegatecall that is not a MultiSendCallOnly batch", async () => {
        const account = await getSafeAccount(multiSendCallOnlyAddress)

        const callData = encodeFunctionData({
            abi: executeUserOpWithErrorStringAbi,
            functionName: "executeUserOpWithErrorString",
            args: ["0x1111111111111111111111111111111111111111", 0n, "0x", 1]
        })

        await expect(account.decodeCalls?.(callData)).rejects.toThrow(
            "only MultiSendCallOnly batches are supported"
        )
    })

    test("throws on a batch containing a delegatecall", async () => {
        const account = await getSafeAccount(multiSendCallOnlyAddress)

        const callData = encodeFunctionData({
            abi: executeUserOpWithErrorStringAbi,
            functionName: "executeUserOpWithErrorString",
            args: [
                multiSendCallOnlyAddress,
                0n,
                encodeMultiSend([
                    {
                        to: "0x1111111111111111111111111111111111111111",
                        data: "0x",
                        value: 0n,
                        operation: 1
                    }
                ]),
                1
            ]
        })

        await expect(account.decodeCalls?.(callData)).rejects.toThrow(
            "Cannot decode a MultiSendCallOnly batch containing a delegatecall"
        )
    })
})
