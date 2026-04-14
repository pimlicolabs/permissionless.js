import { decodeFunctionData, getAddress, zeroAddress } from "viem"
import { describe, expect, test } from "vitest"
import { AccountNotFoundError } from "../errors/index"
import { encodeUninstallModule } from "./encodeUninstallModule"

const mockAccount = {
    address: "0x1234567890123456789012345678901234567890"
} as any

const moduleAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

describe("encodeUninstallModule", () => {
    test("single module with context", () => {
        const result = encodeUninstallModule({
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

    test("single module with deInitData", () => {
        const result = encodeUninstallModule({
            account: mockAccount,
            modules: {
                type: "executor",
                address: moduleAddress,
                deInitData: "0xdeadbeef"
            }
        })

        expect(result).toHaveLength(1)
        expect(result[0].data).toBeDefined()
    })

    test("array of multiple modules", () => {
        const result = encodeUninstallModule({
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

    test("all module types encode correctly", () => {
        const moduleTypes = [
            { type: "validator" as const, expected: 1n },
            { type: "executor" as const, expected: 2n },
            { type: "fallback" as const, expected: 3n },
            { type: "hook" as const, expected: 4n }
        ]

        const abi = [
            {
                type: "function" as const,
                name: "uninstallModule" as const,
                inputs: [
                    { name: "moduleType", type: "uint256" as const },
                    { name: "module", type: "address" as const },
                    { name: "deInitData", type: "bytes" as const }
                ],
                outputs: [],
                stateMutability: "nonpayable" as const
            }
        ]

        for (const { type, expected } of moduleTypes) {
            const result = encodeUninstallModule({
                account: mockAccount,
                modules: {
                    type,
                    address: moduleAddress,
                    context: "0x"
                }
            })

            const decoded = decodeFunctionData({
                abi,
                data: result[0].data
            })

            expect(decoded.args[0]).toBe(expected)
            expect(decoded.args[1]).toBe(getAddress(moduleAddress))
        }
    })

    test("throws AccountNotFoundError when no account", () => {
        expect(() =>
            encodeUninstallModule({
                modules: {
                    type: "validator",
                    address: moduleAddress,
                    context: "0x"
                }
            } as any)
        ).toThrow(AccountNotFoundError)
    })
})
