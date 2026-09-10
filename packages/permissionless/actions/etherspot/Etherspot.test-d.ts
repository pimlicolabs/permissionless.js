import { Etherspot } from "permissionless/etherspot"
import { Client, http } from "viem"
import type { RpcSchema } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

const client = Client.create({ transport: http("https://skandha.invalid") })

describe("Etherspot", () => {
    test("namespace names", () => {
        expectTypeOf<
            keyof typeof Etherspot
        >().toEqualTypeOf<"getUserOperationGasPrice">()
        expectTypeOf<Etherspot.GetUserOperationGasPriceReturnType>().toEqualTypeOf<{
            maxFeePerGas: bigint
            maxPriorityFeePerGas: bigint
        }>()
        expectTypeOf<Etherspot.Schema>().toExtend<RpcSchema.Generic>()
        expectTypeOf<
            Etherspot.Schema["Request"]["method"]
        >().toEqualTypeOf<"skandha_getGasPrice">()
    })

    test("getUserOperationGasPrice takes a client with request", () => {
        expectTypeOf(Etherspot.getUserOperationGasPrice).toBeCallableWith(
            client
        )
        expectTypeOf(
            Etherspot.getUserOperationGasPrice
        ).returns.resolves.toEqualTypeOf<Etherspot.GetUserOperationGasPriceReturnType>()
    })
})
