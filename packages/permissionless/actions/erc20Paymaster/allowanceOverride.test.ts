import { Hex } from "viem/utils"
import { describe, expect, test } from "vitest"
import {
    type AllowanceOverrideParameters,
    allowanceOverride
} from "./allowanceOverride"

const slotOf = (
    result: ReturnType<typeof allowanceOverride>,
    token: `0x${string}`
) => {
    const slots = Object.keys(result[token]?.stateDiff ?? {})
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatch(/^0x[0-9a-f]{64}$/)
    return slots[0] as `0x${string}`
}

describe("allowanceOverride", () => {
    test("should return the correct structure for valid inputs", () => {
        const params = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            spender: "0xDDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd",
            slot: BigInt(1),
            amount: BigInt(100)
        } as const

        const result = allowanceOverride(params)

        expect(result).toEqual({
            [params.token]: {
                stateDiff: {
                    [slotOf(result, params.token)]: Hex.fromNumber(
                        params.amount
                    )
                }
            }
        })
    })

    test("should use the default amount when none is provided", () => {
        const params: AllowanceOverrideParameters = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            spender: "0xDDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd",
            slot: BigInt(1)
        }

        const result = allowanceOverride(params)

        const expectedDefaultAmount = BigInt(
            "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
        )

        expect(result).toEqual({
            [params.token]: {
                stateDiff: {
                    [slotOf(result, params.token)]: Hex.fromNumber(
                        expectedDefaultAmount
                    )
                }
            }
        })
    })
})
