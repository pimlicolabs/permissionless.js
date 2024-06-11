import type { Instance } from "prool"
import { http } from "viem"
import { foundry } from "viem/chains"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
    type BundlerClient,
    createBundlerClient
} from "../../clients/createBundlerClient"
import { getPortsForTest } from "../../setupTests"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils"

describe.sequential("chainId", () => {
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>

    beforeAll(async () => {
        const { altoPort } = getPortsForTest("bundlerActions")
        const altoRpc = `http://localhost:${altoPort}`
        const entryPoint = ENTRYPOINT_ADDRESS_V06
        bundlerClient = createBundlerClient({
            transport: http(altoRpc),
            entryPoint
        })
    })

    test("chainId", async () => {
        const chainId = await bundlerClient.chainId()
        expect(chainId).toBe(foundry.id)
    })
})
