import { toHex } from "viem"
import { describe, expect, test } from "vitest"
import {
    type Erc20BalanceOverrideParameters,
    erc20BalanceOverride
} from "./erc20BalanceOverride"

describe("erc20BalanceOverride", () => {
    test("should return the correct structure for valid inputs", () => {
        const params = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            slot: BigInt(1),
            balance: BigInt(1000)
        } as const

        const result = erc20BalanceOverride(params)

        expect(result).toEqual([
            {
                address: params.token,
                stateDiff: [
                    {
                        slot: expect.any(String), // Slot will be a keccak256 hash
                        value: toHex(params.balance)
                    }
                ]
            }
        ])
    })

    test("should use the default balance when none is provided", () => {
        const params: Erc20BalanceOverrideParameters = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            slot: BigInt(1)
        }

        const result = erc20BalanceOverride(params)

        const expectedDefaultBalance = BigInt(
            "0x100000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
        )

        expect(result).toEqual([
            {
                address: params.token,
                stateDiff: [
                    {
                        slot: expect.any(String), // Slot will be a keccak256 hash
                        value: toHex(expectedDefaultBalance)
                    }
                ]
            }
        ])
    })
})
