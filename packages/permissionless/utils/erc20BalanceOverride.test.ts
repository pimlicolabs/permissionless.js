import { Hex } from "viem/utils"
import { describe, expect, test } from "vitest"
import {
    type Erc20BalanceOverrideParameters,
    erc20BalanceOverride
} from "./erc20BalanceOverride"

const slotOf = (
    result: ReturnType<typeof erc20BalanceOverride>,
    token: `0x${string}`
) => {
    const slots = Object.keys(result[token]?.stateDiff ?? {})
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatch(/^0x[0-9a-f]{64}$/)
    return slots[0] as `0x${string}`
}

describe("erc20BalanceOverride", () => {
    test("should return the correct structure for valid inputs", () => {
        const params = {
            token: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            owner: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            slot: BigInt(1),
            balance: BigInt(1000)
        } as const

        const result = erc20BalanceOverride(params)

        expect(result).toEqual({
            [params.token]: {
                stateDiff: {
                    [slotOf(result, params.token)]: Hex.fromNumber(
                        params.balance
                    )
                }
            }
        })
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

        expect(result).toEqual({
            [params.token]: {
                stateDiff: {
                    [slotOf(result, params.token)]: Hex.fromNumber(
                        expectedDefaultBalance
                    )
                }
            }
        })
    })
})
