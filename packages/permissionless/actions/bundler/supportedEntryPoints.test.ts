import { http } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { createBundlerClient } from "../../clients/createBundlerClient"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { supportedEntryPoints } from "./supportedEntryPoints"

describe("supportedEntryPoints", () => {
    testWithRpc("supportedEntryPoints_V06", async ({ rpc }) => {
        const bundlerClientV06 = createBundlerClient({
            transport: http(rpc.altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        const entryPoints = await supportedEntryPoints(bundlerClientV06)
        expect(entryPoints).contain(ENTRYPOINT_ADDRESS_V06)
    })

    testWithRpc("supportedEntryPoints_V07", async ({ rpc }) => {
        const bundlerClientV07 = createBundlerClient({
            transport: http(rpc.altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
        const entryPoints = await supportedEntryPoints(bundlerClientV07)
        expect(entryPoints).contain(ENTRYPOINT_ADDRESS_V07)
    })
})
