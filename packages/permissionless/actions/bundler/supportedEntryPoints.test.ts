import { http } from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import {
    type BundlerClient,
    createBundlerClient
} from "../../clients/createBundlerClient"
import { getPortsForTest } from "../../setupTests"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE
} from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe.sequential("supportedEntryPoints", () => {
    let bundlerClientV06: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    let bundlerClientV07: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>
    let altoRpc: string

    beforeAll(async () => {
        const { altoPort } = getPortsForTest("bundlerActions")
        altoRpc = `http://localhost:${altoPort}`

        bundlerClientV06 = createBundlerClient({
            transport: http(altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        bundlerClientV07 = createBundlerClient({
            transport: http(altoRpc),
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
