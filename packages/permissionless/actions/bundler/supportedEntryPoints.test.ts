import { foundry } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import type { BundlerClient } from "../../clients/createBundlerClient"
import { getPortForTestName, startAltoInstance } from "../../setupTests"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE
} from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe("supportedEntryPoints", () => {
    let port: number
    let bundlerClientV06: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    let bundlerClientV07: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>

    beforeAll(async () => {
        port = await getPortForTestName("bundlerActions")
        bundlerClientV06 = await startAltoInstance({
            port,
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        bundlerClientV07 = await startAltoInstance({
            port,
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
    })

    test("supportedEntryPoints_V06", async () => {
        const entryPoints = await bundlerClientV06.supportedEntryPoints()
        expect(entryPoints).contain(ENTRYPOINT_ADDRESS_V06)
    })

    test("supportedEntryPoints_V07", async () => {
        const entryPoints = await bundlerClientV07.supportedEntryPoints()
        expect(entryPoints).contain(ENTRYPOINT_ADDRESS_V07)
    })
})
