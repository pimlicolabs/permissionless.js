import { describe, expect, test, beforeAll, afterAll } from "vitest"
import { Instance } from "prool"
import { alto } from "prool/instances"
import { createBundlerClient } from "../../clients/createBundlerClient"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils"
import getPort from "get-port"
import { http } from "viem"

const anvilPrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

describe("chainId", () => {
    let altoInstance: Instance
    let port: number

    beforeAll(async () => {
        port = await getPort()
        altoInstance = alto({
            entrypoints: [ENTRYPOINT_ADDRESS_V06],
            rpcUrl: `http://localhost:8485/${port}`,
            executorPrivateKeys: [anvilPrivateKey],
            port
        })
        await altoInstance.start()
    })

    test("chainId", async () => {
        const bundlerClient = createBundlerClient({
            transport: http(`http://localhost:${port}`),
            entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
        })

        const chainId = await bundlerClient.chainId()

        expect(chainId).toBe(1)
    })

    afterAll(async () => {
        await altoInstance.stop()
    })
})
