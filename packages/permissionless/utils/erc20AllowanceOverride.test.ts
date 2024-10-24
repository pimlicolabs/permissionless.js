import { toHex } from "viem"
import { describe, expect, test } from "vitest"
import {
    type Erc20AllowanceOverrideParameters,
    erc20AllowanceOverride
} from "./erc20AllowanceOverride"

describe("erc20AllowanceOverride", () => {
    test("should return the correct structure for valid inputs", () => {
        const params = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            spender: "0xDDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd",
            slot: BigInt(1),
            amount: BigInt(100)
        } as const

        const result = erc20AllowanceOverride(params)

        expect(result).toEqual([
            {
                address: params.token,
                stateDiff: [
                    {
                        slot: expect.any(String), // Slot will be a keccak256 hash
                        value: toHex(params.amount)
                    }
                ]
            }
        ])
    })

    test("should use the default amount when none is provided", () => {
        const params: Erc20AllowanceOverrideParameters = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            spender: "0xDDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd",
            slot: BigInt(1)
        }

        const result = erc20AllowanceOverride(params)

        const expectedDefaultAmount = BigInt(
            "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
        )

        expect(result).toEqual([
            {
                address: params.token,
                stateDiff: [
                    {
                        slot: expect.any(String), // Slot will be a keccak256 hash
                        value: toHex(expectedDefaultAmount)
                    }
                ]
            }
        ])
    })
})
