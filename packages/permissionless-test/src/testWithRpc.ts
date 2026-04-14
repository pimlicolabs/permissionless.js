import { paymaster } from "@pimlico/mock-paymaster"
import getPort from "get-port"
import { anvil } from "prool/instances"
import {
    http,
    createTestClient,
    createWalletClient,
    custom,
    parseEther
} from "viem"
import {
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { test } from "vitest"
import { setupContracts } from "../mock-aa-infra/alto"
import { alto } from "../mock-aa-infra/alto/instance"
import {
    getSingletonPaymaster06Address,
    getSingletonPaymaster07Address,
    getSingletonPaymaster08Address
} from "../../mock-paymaster/constants"

const anvilPrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

const forkUrl = (import.meta as any).env.VITE_FORK_RPC_URL as string | undefined

/**
 * Creates a bundler transport that automatically calls
 * debug_bundler_sendBundleNow + mines a block after every eth_sendUserOperation.
 * This makes bundling deterministic and near-instant.
 */
function createAutoBundleTransport(altoRpc: string, anvilRpc: string) {
    const baseTransport = http(altoRpc)

    return custom({
        async request({ method, params }) {
            const transport = baseTransport({ chain: foundry })
            const result = await transport.request({ method, params } as any)

            // After a user op is submitted, immediately bundle + mine
            if (method === "eth_sendUserOperation") {
                await fetch(altoRpc, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "debug_bundler_sendBundleNow",
                        params: [],
                        id: 1
                    })
                })
                // Mine a block so the bundle tx is included
                const testClient = createTestClient({
                    mode: "anvil",
                    chain: foundry,
                    transport: http(anvilRpc)
                })
                await testClient.mine({ blocks: 1 })
            }

            return result
        }
    })
}

// Shared anvil + alto + paymaster per worker.
// Each test uses a fresh smart account (unique private key), so on-chain state
// from previous tests doesn't interfere. We just clear alto's mempool between tests.
type SharedRig = {
    anvilRpc: string
    altoRpc: string
    paymasterRpc: string
    anvilInstance: Awaited<ReturnType<typeof anvil>>
    altoInstance: Awaited<ReturnType<typeof alto>>
    paymasterInstance: Awaited<ReturnType<typeof paymaster>>
}

let sharedRigPromise: Promise<SharedRig> | null = null

async function getSharedRig(): Promise<SharedRig> {
    if (sharedRigPromise) return sharedRigPromise
    sharedRigPromise = (async () => {
        const anvilPort = await getPort()
        const altoPort = await getPort({ exclude: [anvilPort] })
        const paymasterPort = await getPort({
            exclude: [anvilPort, altoPort]
        })
        const anvilRpc = `http://localhost:${anvilPort}`
        const altoRpc = `http://localhost:${altoPort}`
        const paymasterRpc = `http://localhost:${paymasterPort}`

        const anvilInstance = forkUrl
            ? anvil({
                  chainId: foundry.id,
                  port: anvilPort,
                  hardfork: "Prague",
                  forkUrl
              })
            : anvil({
                  chainId: foundry.id,
                  hardfork: "Prague",
                  port: anvilPort
              })

        await anvilInstance.start()

        if (!forkUrl) {
            await setupContracts(anvilRpc)
        }

        const altoInstance = alto({
            entrypoints: [
                entryPoint06Address,
                entryPoint07Address,
                entryPoint08Address
            ],
            rpcUrl: anvilRpc,
            executorPrivateKeys: [anvilPrivateKey],
            safeMode: false,
            port: altoPort,
            utilityPrivateKey: anvilPrivateKey,
            enableDebugEndpoints: true
        })

        await altoInstance.start()

        const paymasterInstance = paymaster({
            anvilRpc,
            port: paymasterPort,
            altoRpc
        })

        await paymasterInstance.start()

        // Top up paymaster deposits so they don't run out across many tests
        const paymasterSignerAddress = privateKeyToAccount(
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        ).address
        const walletClient = createWalletClient({
            chain: foundry,
            account: privateKeyToAccount(anvilPrivateKey),
            transport: http(anvilRpc)
        })
        const depositToAbi = [
            {
                name: "depositTo",
                type: "function",
                inputs: [{ type: "address", name: "account" }],
                outputs: [],
                stateMutability: "payable"
            }
        ] as const
        const paymasterAddresses = [
            {
                entryPoint: entryPoint06Address,
                paymaster:
                    getSingletonPaymaster06Address(paymasterSignerAddress)
            },
            {
                entryPoint: entryPoint07Address,
                paymaster:
                    getSingletonPaymaster07Address(paymasterSignerAddress)
            },
            {
                entryPoint: entryPoint08Address,
                paymaster:
                    getSingletonPaymaster08Address(paymasterSignerAddress)
            }
        ]
        for (const { entryPoint, paymaster: pm } of paymasterAddresses) {
            await walletClient.writeContract({
                address: entryPoint,
                abi: depositToAbi,
                functionName: "depositTo",
                args: [pm],
                value: parseEther("1000")
            })
        }

        return {
            anvilRpc,
            altoRpc,
            paymasterRpc,
            anvilInstance,
            altoInstance,
            paymasterInstance
        }
    })()
    return sharedRigPromise
}

async function clearAltoState(altoRpc: string): Promise<void> {
    await fetch(altoRpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "debug_bundler_clearState",
            params: [],
            id: 1
        })
    })
}

// Clean up shared rig when the worker process exits
process.on("beforeExit", async () => {
    if (!sharedRigPromise) return
    const rig = await sharedRigPromise
    await Promise.all([
        rig.altoInstance.stop(),
        rig.paymasterInstance.stop(),
        rig.anvilInstance.stop()
    ])
    sharedRigPromise = null
})

export const testWithRpc = test.extend<{
    rpc: {
        anvilRpc: string
        altoRpc: string
        paymasterRpc: string
    }
}>({
    // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
    rpc: async ({}, use) => {
        const rig = await getSharedRig()

        // Clear alto's mempool + reputation between tests
        await clearAltoState(rig.altoRpc)

        // Reset base fee to prevent inflation from accumulated mined blocks.
        // Without this, base fee grows with each non-empty block across tests,
        // causing "AA31 paymaster deposit too low" errors.
        const testClient = createTestClient({
            mode: "anvil",
            chain: foundry,
            transport: http(rig.anvilRpc)
        })
        await testClient.setNextBlockBaseFeePerGas({
            baseFeePerGas: 1000000000n
        })
        await testClient.mine({ blocks: 1 })

        await use({
            anvilRpc: rig.anvilRpc,
            altoRpc: rig.altoRpc,
            paymasterRpc: rig.paymasterRpc
        })
    }
})

export { createAutoBundleTransport }

// Keep getInstances export for backwards compatibility (standalone trio, used in docs references)
export const getInstances = async ({
    anvilPort,
    altoPort,
    paymasterPort
}: { anvilPort: number; altoPort: number; paymasterPort: number }) => {
    const anvilRpc = `http://localhost:${anvilPort}`
    const altoRpc = `http://localhost:${altoPort}`

    const anvilInstance = forkUrl
        ? anvil({
              chainId: foundry.id,
              port: anvilPort,
              hardfork: "Prague",
              forkUrl
          })
        : anvil({
              chainId: foundry.id,
              hardfork: "Prague",
              port: anvilPort
          })

    const altoInstance = alto({
        entrypoints: [
            entryPoint06Address,
            entryPoint07Address,
            entryPoint08Address
        ],
        rpcUrl: anvilRpc,
        executorPrivateKeys: [anvilPrivateKey],
        safeMode: false,
        port: altoPort,
        utilityPrivateKey: anvilPrivateKey
    })

    const paymasterInstance = paymaster({
        anvilRpc,
        port: paymasterPort,
        altoRpc
    })

    await anvilInstance.start()

    if (!forkUrl) {
        await setupContracts(anvilRpc)
    }

    await altoInstance.start()
    await paymasterInstance.start()

    return [anvilInstance, altoInstance, paymasterInstance]
}
