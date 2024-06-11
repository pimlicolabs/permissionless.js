import getPort from "get-port"
import { type Instance, createServer } from "prool"
import { alto, anvil } from "prool/instances"
import { http } from "viem"
import { foundry } from "viem/chains"
import {
    ENTRY_POINT_SIMULATIONS_ADDRESS,
    setupContracts
} from "../permissionless-test/mock-aa-infra/alto"
import { paymaster } from "../permissionless-test/mock-aa-infra/mock-paymaster"
import { createBundlerClient } from "./clients/createBundlerClient"
import type { EntryPoint } from "./types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "./utils"

export const anvilPort = 8485
const anvilServer = createServer({
    instance: anvil({
        chainId: foundry.id
    }),
    limit: 5,
    port: anvilPort
})

const ports: Record<string, number> = {}

export const getPortForTestName = async (testName: string) => {
    if (ports[testName]) {
        return ports[testName]
    }

    const port = await getPort()
    ports[testName] = port

    return port
}

const instances: Record<string, Instance> = {}
const paymasterInstances: Record<string, Instance> = {}

export const startAltoInstance = async <TEntryPoint extends EntryPoint>({
    port,
    entryPoint
}: { port: number; entryPoint: TEntryPoint }) => {
    const altoRpc = `http://localhost:${port}`
    const anvilRpc = `http://localhost:${anvilPort}/${port}`

    if (instances[port]) {
        return createBundlerClient({
            transport: http(altoRpc),
            entryPoint: entryPoint
        })
    }

    const anvilPrivateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

    const instance = alto({
        entrypoints: [ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07],
        rpcUrl: anvilRpc,
        executorPrivateKeys: [anvilPrivateKey],
        entrypointSimulationContract: ENTRY_POINT_SIMULATIONS_ADDRESS,
        safeMode: false,
        port
    })

    // instance.on("stderr", (data) => {
    //     console.log(data.toString())
    // })
    // instance.on("stdout", (data) => {
    //     console.log(data.toString())
    // })

    instances[port] = instance
    const paymasterInstance = paymaster({
        anvilRpc,
        port: await getPort()
    })
    paymasterInstances[port] = paymasterInstance

    await setupContracts(anvilRpc)
    await instance.start()
    await paymasterInstance.start()

    return createBundlerClient({
        transport: http(altoRpc),
        entryPoint: entryPoint
    })
}

export const setup = async () => {
    await anvilServer.start()
}

export const teardown = async () => {
    await anvilServer.stop()
    await Promise.all(
        Object.values(instances).map((instance) => instance.stop())
    )
}
