import { resolve } from "node:path"
import { defineInstance, toArgs } from "prool"
import { execa } from "prool/processes"

export type AltoParameters = {
    /**
     * API version (used for internal Pimlico versioning compatibility).
     */
    apiVersion?: readonly string[] | undefined
    /**
     * Override the sender native token balance during estimation
     */
    balanceOverride?: boolean | undefined
    /**
     * Binary path of the `alto` executable.
     */
    binary?: string | undefined
    /**
     * Address of the `BundleBulker` contract.
     */
    bundleBulkerAddress?: `0x${string}` | undefined
    /**
     * Set if the bundler bundle user operations automatically or only when calling `debug_bundler_sendBundleNow`.
     * @default "auto"
     */
    bundleMode?: "auto" | "manual" | undefined
    /**
     * Indicates weather the chain is a OP stack chain, arbitrum chain, or default EVM chain.
     */
    chainType?: "default" | "op-stack" | "arbitrum" | undefined
    /**
     * Path to JSON config file.
     */
    config?: string | undefined
    /**
     * Skip user operation validation, use with caution.
     */
    dangerousSkipUserOperationValidation?: boolean | undefined
    /**
     * Default API version.
     */
    defaultApiVersion?: string | undefined
    /**
     * Enable debug endpoints.
     * @default false
     */
    enableDebugEndpoints?: boolean | undefined
    /**
     * Include user ops with the same sender in the single bundle.
     * @default true
     */
    enforceUniqueSendersPerBundle?: boolean | undefined
    /**
     * EntryPoint contract addresses.
     */
    entrypoints: readonly `0x${string}`[]
    /**
     * Address of the EntryPoint simulations contract.
     */
    entrypointSimulationContract?: `0x${string}` | undefined
    /**
     * Private keys of the executor accounts.
     */
    executorPrivateKeys?: readonly `0x${string}`[]
    /**
     * Interval to refill the signer balance (seconds).
     * @default 1200
     */
    executorRefillInterval?: number | undefined
    /**
     * Should the node make expiration checks.
     * @default true
     */
    expirationCheck?: boolean | undefined
    /**
     * Amount to multiply the gas prices fetched from the node.
     * @default "100"
     */
    gasPriceBump?: string | undefined
    /**
     * Maximum that the gas prices fetched using pimlico_getUserOperationGasPrice will be accepted for (seconds).
     * @default 10
     */
    gasPriceExpiry?: number | undefined
    /**
     * The minimum percentage of incoming user operation gas prices compared to the gas price used by the bundler to submit bundles.
     * @default 101
     */
    gasPriceFloorPercent?: number | undefined
    /**
     * Amount to multiply the gas prices fetched using `pimlico_getUserOperationGasPrice`.
     * @default "105,110,115"
     */
    gasPriceMultipliers?: readonly string[] | undefined
    /**
     * Use a fixed value for gas limits during bundle transaction gas limit estimations
     */
    fixedGasLimitForEstimation?: string | undefined
    /**
     * Flush stuck transactions with old nonces during bundler startup.
     */
    flushStuckTransactionsDuringStartup?: boolean | undefined
    /**
     * Log in JSON format.
     */
    json?: boolean | undefined
    /**
     * Send legacy transactions instead of an EIP-1559 transactions.
     * @default false
     */
    legacyTransactions?: boolean | undefined
    /**
     * Calculate the bundle transaction gas limits locally instead of using the RPC gas limit estimation.
     */
    localGasLimitCalculation?: boolean | undefined
    /**
     * Default log level.
     */
    logLevel?:
        | "trace"
        | "debug"
        | "info"
        | "warn"
        | "error"
        | "fatal"
        | undefined
    /**
     * Max block range for `eth_getLogs` calls.
     */
    maxBlockRange?: number | undefined
    /**
     * Maximum number of operations allowed in the mempool before a bundle is submitted.
     * @default 10
     */
    maxBundleSize?: number | undefined
    /**
     * Maximum time to wait for a bundle to be submitted (ms).
     * @default 1000
     */
    maxBundleWait?: number | undefined
    /**
     * Maximum amount of gas per bundle.
     * @default "5000000"
     */
    maxGasPerBundle?: string | undefined
    /**
     * Maximum number of executor accounts to use from the list of executor private keys.
     */
    maxExecutors?: number | undefined
    /**
     * Maximum amount of parallel user ops to keep in the meempool (same sender, different nonce keys).
     * @default 10
     */
    mempoolMaxParallelOps?: number | undefined
    /**
     * Maximum amount of sequential user ops to keep in the mempool (same sender and nonce key, different nonce values).
     * @default 0
     */
    mempoolMaxQueuedOps?: number | undefined
    /**
     * Minimum stake required for a relay (in 10e18).
     * @default 1
     */
    minEntityStake?: number | undefined
    /**
     * Minimum unstake delay (seconds).
     * @default 1
     */
    minEntityUnstakeDelay?: number | undefined
    /**
     * Minimum balance required for each executor account (below which the utility account will refill).
     */
    minExecutorBalance?: string | undefined
    /**
     * Name of the network (used for metrics).
     * @default "localhost"
     */
    networkName?: string | undefined
    /**
     * Amount to multiply the paymaster gas limits fetched from simulations.
     */
    paymasterGasLimitMultiplier?: string | undefined
    /**
     * Address of the `PerOpInflator` contract.
     */
    perOpInflatorAddress?: `0x${string}` | undefined
    /**
     * Polling interval for querying for new blocks (ms).
     * @default 1000
     */
    pollingInterval?: number | undefined
    /**
     * Port to listen on.
     * @default 3000
     */
    port?: number | undefined
    /**
     * RPC url to connect to.
     */
    rpcUrl: string
    /**
     * Enable safe mode (enforcing all ERC-4337 rules).
     * @default true
     */
    safeMode?: boolean | undefined
    /**
     * RPC url to send transactions to (e.g. flashbots relay).
     */
    sendTransactionRpcUrl?: string | undefined
    /**
     * Timeout for incoming requests (in ms).
     */
    timeout?: number | undefined
    /**
     * Private key of the utility account.
     */
    utilityPrivateKey?: string | undefined
    /**
     * Maximum payload size for websocket messages in bytes (default to 1MB).
     */
    websocketMaxPayloadSize?: number | undefined
    /**
     * Enable websocket server.
     */
    websocket?: boolean | undefined
}

/**
 * Defines an Alto instance.
 *
 * @example
 * ```ts
 * const instance = alto({
 *  entrypoints: ['0x0000000071727De22E5E9d8BAf0edAc6f37da032'],
 *  rpcUrl: `http://localhost:8545`,
 *  executorPrivateKeys: ['0x...'],
 * })
 * await instance.start()
 * // ...
 * await instance.stop()
 * ```
 */
export const alto = defineInstance((parameters?: AltoParameters) => {
    const { ...args } = (parameters || {}) as AltoParameters

    const name = "alto"
    const process = execa({ name })

    return {
        _internal: {
            args,
            get process() {
                return process._internal.process
            }
        },
        host: "localhost",
        name,
        port: args.port ?? 3000,
        async start({ port = args.port ?? 3000 }, options) {
            const binary = (() => {
                if (args.binary) return [args.binary]
                const libPath =
                    "resolve" in import.meta
                        ? import.meta.resolve("@pimlico/alto").split("file:")[1]
                        : require.resolve("@pimlico/alto")
                return ["node", resolve(libPath, "../cli/alto.js")]
            })()

            await process.start(
                ($) => $`${binary} ${toArgs({ port, ...args })}`,
                {
                    ...options,
                    // Resolve when the process is listening via a "Server listening at" message.
                    resolver({ process, reject, resolve }) {
                        process.stdout.on("data", (data) => {
                            const message = data.toString()
                            if (message.includes("Server listening at"))
                                resolve()
                        })
                        //   process.stderr.on('data', reject)
                    }
                }
            )
        },
        async stop() {
            await process.stop()
        }
    }
})
