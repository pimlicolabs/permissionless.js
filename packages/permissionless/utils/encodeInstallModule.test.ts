import { decodeFunctionData, getAddress, zeroAddress } from "viem"
import { describe, expect, test } from "vitest"
import { AccountNotFoundError } from "../errors/index"
import { encodeInstallModule } from "./encodeInstallModule"

const mockAccount = {
    address: "0x1234567890123456789012345678901234567890"
} as any

const moduleAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

describe("encodeInstallModule", () => {
    test("single module with context", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: {
                type: "validator",
                address: moduleAddress,
                context: "0x1234"
            }
        })

        expect(result).toHaveLength(1)
        expect(result[0].to).toBe(mockAccount.address)
        expect(result[0].value).toBe(0n)
        expect(result[0].data).toBeDefined()
    })

    test("single module with initData", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: {
                type: "executor",
                address: moduleAddress,
                initData: "0xdeadbeef"
            }
        })

        expect(result).toHaveLength(1)
        expect(result[0].data).toBeDefined()
    })

    test("array of multiple modules", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: [
                {
                    type: "validator",
                    address: moduleAddress,
                    context: "0x1234"
                },
                {
                    type: "executor",
                    address: zeroAddress,
                    context: "0x5678"
                }
            ]
        })

        expect(result).toHaveLength(2)
        expect(result[0].to).toBe(mockAccount.address)
        expect(result[1].to).toBe(mockAccount.address)
    })

    test("validator module type encodes correctly", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: {
                type: "validator",
                address: moduleAddress,
                context: "0x"
            }
        })

        const decoded = decodeFunctionData({
            abi: [
                {
                    type: "function",
                    name: "installModule",
                    inputs: [
                        { name: "moduleType", type: "uint256" },
                        { name: "module", type: "address" },
                        { name: "initData", type: "bytes" }
                    ],
                    outputs: [],
                    stateMutability: "nonpayable"
                }
            ],
            data: result[0].data
        })

        expect(decoded.args[0]).toBe(1n) // validator = 1
        expect(decoded.args[1]).toBe(getAddress(moduleAddress))
    })

    test("executor module type encodes correctly", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: {
                type: "executor",
                address: moduleAddress,
                context: "0x"
            }
        })

        const decoded = decodeFunctionData({
            abi: [
                {
                    type: "function",
                    name: "installModule",
                    inputs: [
                        { name: "moduleType", type: "uint256" },
                        { name: "module", type: "address" },
                        { name: "initData", type: "bytes" }
                    ],
                    outputs: [],
                    stateMutability: "nonpayable"
                }
            ],
            data: result[0].data
        })

        expect(decoded.args[0]).toBe(2n) // executor = 2
    })

    test("fallback module type encodes correctly", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: {
                type: "fallback",
                address: moduleAddress,
                context: "0x"
            }
        })

        const decoded = decodeFunctionData({
            abi: [
                {
                    type: "function",
                    name: "installModule",
                    inputs: [
                        { name: "moduleType", type: "uint256" },
                        { name: "module", type: "address" },
                        { name: "initData", type: "bytes" }
                    ],
                    outputs: [],
                    stateMutability: "nonpayable"
                }
            ],
            data: result[0].data
        })

        expect(decoded.args[0]).toBe(3n) // fallback = 3
    })

    test("hook module type encodes correctly", () => {
        const result = encodeInstallModule({
            account: mockAccount,
            modules: {
                type: "hook",
                address: moduleAddress,
                context: "0x"
            }
        })

        const decoded = decodeFunctionData({
            abi: [
                {
                    type: "function",
                    name: "installModule",
                    inputs: [
                        { name: "moduleType", type: "uint256" },
                        { name: "module", type: "address" },
                        { name: "initData", type: "bytes" }
                    ],
                    outputs: [],
                    stateMutability: "nonpayable"
                }
            ],
            data: result[0].data
        })

        expect(decoded.args[0]).toBe(4n) // hook = 4
    })

    test("throws AccountNotFoundError when no account", () => {
        expect(() =>
            encodeInstallModule({
                modules: {
                    type: "validator",
                    address: moduleAddress,
                    context: "0x"
                }
            } as any)
        ).toThrow(AccountNotFoundError)
    })
})
