/// <reference types="vite/client" />
import { paymaster } from "@pimlico/mock-paymaster"
import getPort from "get-port"
import { anvil } from "prool/instances"
import { Account, Client, custom, http, testActions, walletActions } from "viem"
import { anvil as anvilChain } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { Value } from "viem/utils"
import { test } from "vitest"
import {
    getSingletonPaymaster06Address,
    getSingletonPaymaster07Address,
    getSingletonPaymaster08Address
} from "../../mock-paymaster/constants"
import { setupContracts } from "../mock-aa-infra/alto"
import { alto } from "../mock-aa-infra/alto/instance"

const anvilPrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

const forkUrl = import.meta.env.VITE_FORK_RPC_URL as string | undefined

/**
 * Creates a bundler transport that automatically calls
 * debug_bundler_sendBundleNow + mines a block after every eth_sendUserOperation.
 * This makes bundling deterministic and near-instant.
 */
function createAutoBundleTransport(altoRpc: string, anvilRpc: string) {
    const transport = http(altoRpc).setup({ chain: anvilChain })

    return custom({
        async request({ method, params }) {
            const result = await transport.request({ method, params })

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
                const testClient = Client.create({
                    chain: anvilChain,
                    transport: http(anvilRpc)
                }).extend(testActions({ mode: "anvil" }))
                await testClient.block.mine({ blocks: 1 })
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
                  chainId: anvilChain.id,
                  port: anvilPort,
                  hardfork: "Prague",
                  forkUrl
              })
            : anvil({
                  chainId: anvilChain.id,
                  hardfork: "Prague",
                  port: anvilPort
              })

        await anvilInstance.start()

        if (!forkUrl) {
            await setupContracts(anvilRpc)
        }

        const altoInstance = alto({
            entrypoints: [
                EntryPoint.addressV06,
                EntryPoint.addressV07,
                EntryPoint.addressV08
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
        const paymasterSignerAddress = Account.fromPrivateKey(
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        ).address
        const walletClient = Client.create({
            chain: anvilChain,
            account: Account.fromPrivateKey(anvilPrivateKey),
            transport: http(anvilRpc)
        }).extend(walletActions())
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
                entryPoint: EntryPoint.addressV06,
                paymaster: getSingletonPaymaster06Address(
                    paymasterSignerAddress
                )
            },
            {
                entryPoint: EntryPoint.addressV07,
                paymaster: getSingletonPaymaster07Address(
                    paymasterSignerAddress
                )
            },
            {
                entryPoint: EntryPoint.addressV08,
                paymaster: getSingletonPaymaster08Address(
                    paymasterSignerAddress
                )
            }
        ]
        for (const { entryPoint, paymaster: pm } of paymasterAddresses) {
            await walletClient.contract.write({
                address: entryPoint,
                abi: depositToAbi,
                functionName: "depositTo",
                args: [pm],
                value: Value.fromEther("1000")
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
        const testClient = Client.create({
            chain: anvilChain,
            transport: http(rig.anvilRpc)
        }).extend(testActions({ mode: "anvil" }))
        await testClient.block.setNextBaseFeePerGas({
            baseFeePerGas: 1000000000n
        })
        await testClient.block.mine({ blocks: 1 })

        await use({
            anvilRpc: rig.anvilRpc,
            altoRpc: rig.altoRpc,
            paymasterRpc: rig.paymasterRpc
        })
    }
})

export { createAutoBundleTransport }
