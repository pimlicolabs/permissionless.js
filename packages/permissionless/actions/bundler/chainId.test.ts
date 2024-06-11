import { foundry } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import type { BundlerClient } from "../../clients/createBundlerClient"
import { getPortForTestName, startAltoInstance } from "../../setupTests"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils"

describe("chainId", () => {
    let port: number
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>

    beforeAll(async () => {
        port = await getPortForTestName("bundlerActions")
        bundlerClient = await startAltoInstance({
            port,
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })
    })

    test("chainId", async () => {
        const chainId = await bundlerClient.chainId()
        expect(chainId).toBe(foundry.id)
    })
})
