import type { Client } from "viem"
import { describe, expect, test } from "vitest"
import { getUserOperationGasPrice } from "./getUserOperationGasPrice"

describe("etherspot getUserOperationGasPrice", () => {
    test("decodes skandha_getGasPrice into bigints", async () => {
        const calls: string[] = []
        const client: Pick<Client.Client, "request"> = {
            request: (async ({ method }: { method: string }) => {
                calls.push(method)
                return { maxFeePerGas: "0x2", maxPriorityFeePerGas: "0x1" }
            }) as unknown as Client.Client["request"]
        }
        expect(await getUserOperationGasPrice(client)).toEqual({
            maxFeePerGas: 2n,
            maxPriorityFeePerGas: 1n
        })
        expect(calls).toEqual(["skandha_getGasPrice"])
    })
})
