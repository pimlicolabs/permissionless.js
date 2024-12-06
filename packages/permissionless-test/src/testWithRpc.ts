import getPort from "get-port"
import { alto, anvil } from "prool/instances"
import {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { foundry } from "viem/chains"
import { test } from "vitest"
import {
    ENTRY_POINT_SIMULATIONS_ADDRESS,
    setupContracts
} from "../mock-aa-infra/alto"
import { paymaster } from "../mock-aa-infra/mock-paymaster"
import { createTestClient, parseEther } from "viem"
import { http } from "viem"
import { privateKeyToAccount } from "viem/accounts"

export const getInstances = async ({
    anvilPort,
    altoPort,
    paymasterPort
}: { anvilPort: number; altoPort: number; paymasterPort: number }) => {
    const anvilRpc = `http://localhost:${anvilPort}`
    const altoRpc = `http://localhost:${altoPort}`

    const anvilPrivateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

    const forkUrl = (import.meta as any).env.VITE_FORK_RPC_URL as
        | string
        | undefined

    const anvilInstance = anvil({
        chainId: foundry.id,
        port: anvilPort,
        forkUrl
    })

    const altoInstance = alto({
        entrypoints: [entryPoint06Address, entryPoint07Address],
        rpcUrl: anvilRpc,
        executorPrivateKeys: [anvilPrivateKey],
        entrypointSimulationContract: ENTRY_POINT_SIMULATIONS_ADDRESS,
        safeMode: false,
        port: altoPort
    })

    // instance.on("stderr", (data) => {
    //     console.error(data.toString())
    // })
    // instance.on("stdout", (data) => {
    //     console.log(data.toString())
    // })

    const paymasterInstance = paymaster({
        anvilRpc,
        port: paymasterPort,
        altoRpc
    })

    await anvilInstance.start()
    await altoInstance.start()
    await paymasterInstance.start()

    if (!forkUrl) {
        await setupContracts(anvilRpc)
    }

    return [anvilInstance, altoInstance, paymasterInstance]
}

let ports: number[] = []

export const testWithRpc = test.extend<{
    rpc: {
        anvilRpc: string
        altoRpc: string
        paymasterRpc: string
    }
}>({
    // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
    rpc: async ({}, use) => {
        const altoPort = await getPort({
            exclude: ports
        })
        ports.push(altoPort)
        const paymasterPort = await getPort({
            exclude: ports
        })
        ports.push(paymasterPort)
        const anvilPort = await getPort({
            exclude: ports
        })
        ports.push(anvilPort)

        const anvilRpc = `http://localhost:${anvilPort}`
        const altoRpc = `http://localhost:${altoPort}`
        const paymasterRpc = `http://localhost:${paymasterPort}`

        const instances = await getInstances({
            anvilPort,
            altoPort,
            paymasterPort
        })

        await use({
            anvilRpc,
            altoRpc,
            paymasterRpc
        })

        await Promise.all([...instances.map((instance) => instance.stop())])
        ports = ports.filter(
            (port) =>
                port !== altoPort ||
                port !== anvilPort ||
                port !== paymasterPort
        )
    }
})
