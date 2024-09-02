import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getPimlicoClient } from "../../../permissionless-test/src/utils"
import { getUserOperationGasPrice } from "./getUserOperationGasPrice"

describe("getUserOperationGasPrice", () => {
    testWithRpc("getUserOperationGasPrice", async ({ rpc }) => {
        const pimlicoBundlerClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: rpc.altoRpc
        })

        const gasPrice = await getUserOperationGasPrice(pimlicoBundlerClient)

        expect(gasPrice).toBeTruthy()
        expect(gasPrice.slow).toBeTruthy()
        expect(gasPrice.standard).toBeTruthy()
        expect(gasPrice.fast).toBeTruthy()
        expect(typeof gasPrice.slow.maxFeePerGas).toBe("bigint")
        expect(gasPrice.slow.maxFeePerGas).toBeGreaterThan(0n)
        expect(typeof gasPrice.slow.maxPriorityFeePerGas).toBe("bigint")
        expect(gasPrice.slow.maxPriorityFeePerGas).toBeGreaterThan(0n)
        expect(typeof gasPrice.standard.maxFeePerGas).toBe("bigint")
        expect(gasPrice.standard.maxFeePerGas).toBeGreaterThan(0n)
        expect(typeof gasPrice.standard.maxPriorityFeePerGas).toBe("bigint")
        expect(gasPrice.standard.maxPriorityFeePerGas).toBeGreaterThan(0n)
        expect(typeof gasPrice.fast.maxFeePerGas).toBe("bigint")
        expect(gasPrice.fast.maxFeePerGas).toBeGreaterThan(0n)
        expect(typeof gasPrice.fast.maxPriorityFeePerGas).toBe("bigint")
        expect(gasPrice.fast.maxPriorityFeePerGas).toBeGreaterThan(0n)
    })
})
