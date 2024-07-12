import { http } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../utils"
import { createBundlerClient } from "./createBundlerClient"

describe("createBundlerClient", () => {
    testWithRpc("createBundlerClient_V06", async ({ rpc }) => {
        const bundlerClientV06 = createBundlerClient({
            transport: http(rpc.altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        const entryPoints = await bundlerClientV06.supportedEntryPoints()
        expect(entryPoints).contain(ENTRYPOINT_ADDRESS_V06)
    })

    testWithRpc("createBundlerClient_V07", async ({ rpc }) => {
        const bundlerClientV07 = createBundlerClient({
            transport: http(rpc.altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
        const entryPoints = await bundlerClientV07.supportedEntryPoints()
        expect(entryPoints).contain(ENTRYPOINT_ADDRESS_V07)
    })
})
