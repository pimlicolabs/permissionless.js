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

export const getPortsForTest = (name: "bundlerActions") => {
    switch (name) {
        case "bundlerActions":
            return {
                altoPort: 43371,
                paymasterPort: 43372
            }
    }
}

// export const getAltoInstance = async <TEntryPoint extends EntryPoint>({
//     anvilPort,
//     altoPort,
//     paymasterPort
// }: { anvilPort: number; altoPort: number; paymasterPort: number }) => {
//     const anvilRpc = `http://localhost:${anvilPort}`
//     const altoRpc = `http://localhost:${altoPort}`

//     const anvilPrivateKey =
//         "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

//     const anvilInstance = anvil({
//         chainId: foundry.id,
//         port: anvilPort
//     })

//     const instance = alto({
//         entrypoints: [ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07],
//         rpcUrl: anvilRpc,
//         executorPrivateKeys: [anvilPrivateKey],
//         entrypointSimulationContract: ENTRY_POINT_SIMULATIONS_ADDRESS,
//         safeMode: false,
//         port: altoPort
//     })

//     // instance.on("stderr", (data) => {
//     //     console.error(data.toString())
//     // })
//     // instance.on("stdout", (data) => {
//     //     console.log(data.toString())
//     // })

//     const paymasterInstance = paymaster({
//         anvilRpc,
//         port: paymasterPort,
//         altoRpc
//     })
//     await anvilInstance.start()
//     await setupContracts(anvilRpc)
//     await instance.start()
//     await paymasterInstance.start()

//     return [anvilInstance, instance, paymasterInstance]
// }

export const startAltoInstance = async <TEntryPoint extends EntryPoint>({
    altoPort,
    paymasterPort
}: { altoPort: number; paymasterPort: number }) => {
    const anvilRpc = `http://localhost:${anvilPort}/${altoPort}`
    const altoRpc = `http://localhost:${altoPort}`

    const anvilPrivateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

    const instance = alto({
        entrypoints: [ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07],
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
    await setupContracts(anvilRpc)
    await instance.start()
    await paymasterInstance.start()

    instances.push(instance)
    instances.push(paymasterInstance)
}

const instances: Instance[] = []
export const setup = async () => {
    await anvilServer.start()
    await startAltoInstance(getPortsForTest("bundlerActions"))
}

export const teardown = async () => {
    await Promise.all([
        ...instances.map((instance) => instance.stop()),
        anvilServer.stop()
    ])
}
