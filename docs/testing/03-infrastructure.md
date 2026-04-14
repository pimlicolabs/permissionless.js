# 03 — Infrastructure (Anvil, Alto, mock paymaster)

Three processes are spawned **once per Vitest worker** and shared across all tests in that worker. This document describes how each is configured, how they are started and stopped, and what guarantees each provides.

All three are built on [`prool`](https://github.com/wevm/prool), a small library for orchestrating local dev processes (it provides `defineInstance` + an `execa`-based process manager). Each instance exposes `.start()` and `.stop()`.

## Anvil

Spawned in `packages/permissionless-test/src/testWithRpc.ts` inside `getSharedRig()` via `prool/instances`'s built-in `anvil` factory:

```ts
import { anvil } from "prool/instances"

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
```

| Setting       | Value                                               | Notes                                                                                              |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `chainId`     | `foundry.id` (`31337`)                              | Same chainId whether forked or not. All viem clients use `chain: foundry`.                         |
| `hardfork`    | `"Prague"`                                          | Pinned to Prague for consistent behavior (EIP-7702 is Prague-era; some tests rely on its opcodes). |
| `port`        | `anvilPort` (dynamic)                               | Allocated once per worker via `get-port`. See [02-lifecycle.md § Port allocation](./02-lifecycle.md#port-allocation). |
| `forkUrl`     | `process.env.VITE_FORK_RPC_URL` (optional)          | If set, Anvil boots as a fork of that chain at its tip.                                            |

### Default funded account

Anvil ships with 10 pre-funded accounts from the mnemonic `test test test test test test test test test test test junk`. The tests care about index 0 in particular:

- Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Address:     `0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266`

This key is used:

1. As the default signer for `walletClient` in `setupContracts` (`mock-aa-infra/alto/index.ts:107`).
2. As Alto's `executorPrivateKeys[0]` and `utilityPrivateKey`.
3. For topping up paymaster deposits in `getSharedRig()`.
4. Indirectly via `getAnvilWalletClient({ addressIndex: 0 })` helper.

### Base fee management

With the shared-per-worker model, many blocks are mined across tests (each `eth_sendUserOperation` triggers `debug_bundler_sendBundleNow` + `mine`). Anvil's EIP-1559 base fee increases with each non-empty block. To prevent gas costs from spiraling, the `testWithRpc` fixture resets the base fee to 1 gwei before each test:

```ts
await testClient.setNextBlockBaseFeePerGas({ baseFeePerGas: 1000000000n })
await testClient.mine({ blocks: 1 })
```

### Fork mode

If `VITE_FORK_RPC_URL` is set in `.env.test` (or process env), Anvil starts as a fork of that URL. The fixture also **skips** `setupContracts(anvilRpc)` because a live network already has the EntryPoints, factories, etc. deployed at their deterministic addresses.

See [06-ci-and-running.md § Fork mode](./06-ci-and-running.md#fork-mode) for usage.

## Alto bundler

The Alto wrapper lives in `packages/permissionless-test/mock-aa-infra/alto/instance.ts`. It is a **custom `prool` instance** (not shipped by `prool` itself) built with `defineInstance` + `execa`.

The shared rig constructs Alto with:

```ts
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
```

| Setting                  | Value                                      | Why                                                                                                   |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `entrypoints`            | `[v0.6, v0.7, v0.8]`                       | Tests exercise all three EntryPoint versions, so Alto must register all three.                        |
| `rpcUrl`                 | `http://localhost:${anvilPort}`            | The chain Alto watches/submits to.                                                                    |
| `executorPrivateKeys`    | `[anvilPrivateKey]`                        | The account(s) that sign handleOps bundle transactions.                                               |
| `utilityPrivateKey`      | `anvilPrivateKey`                          | Alto's utility wallet (refills executors, deploys supporting contracts).                              |
| `safeMode`               | `false`                                    | Skips ERC-4337 validity-rule enforcement. Test-only convenience; do not copy into production configs. |
| `port`                   | `altoPort`                                 | Allocated once per worker via `get-port`.                                                             |
| `enableDebugEndpoints`   | `true`                                     | **Required** for `debug_bundler_clearState` (per-test mempool reset) and `debug_bundler_sendBundleNow` (deterministic bundling via `createAutoBundleTransport`). |

Using the anvil account 0 key for **both** executor and utility is fine: that account is funded with 10,000 ETH by Anvil, so gas costs are unbounded.

### Debug endpoints

Two Alto debug endpoints are critical to the shared-rig model:

- **`debug_bundler_clearState`**: Clears Alto's in-memory mempool and reputation tracking. Called before each test to prevent state leakage.
- **`debug_bundler_sendBundleNow`**: Immediately bundles all pending user operations. Used by `createAutoBundleTransport` to make bundling deterministic rather than waiting for Alto's periodic timer (~4s).

### How `alto` is spawned

From `packages/permissionless-test/mock-aa-infra/alto/instance.ts`:

```ts
export const alto = defineInstance((parameters?: AltoParameters) => {
    const { ...args } = (parameters || {}) as AltoParameters
    const name = "alto"
    const process = execa({ name })

    return {
        _internal: { args, get process() { return process._internal.process } },
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
                    resolver({ process, reject, resolve }) {
                        process.stdout.on("data", (data) => {
                            const message = data.toString()
                            if (message.includes("Server listening at"))
                                resolve()
                        })
                    }
                }
            )
        },

        async stop() { await process.stop() }
    }
})
```

Key observations:

1. The binary is resolved from the `@pimlico/alto` npm package's `cli/alto.js` entrypoint. It runs via `node`, not a standalone binary.
2. Arguments are built by `toArgs(...)` from `prool` — it turns the `AltoParameters` object into a CLI argument list.
3. **Readiness signal: the literal string `"Server listening at"` on stdout.** The `start()` promise only resolves once this appears, which means tests can safely make RPC calls against Alto as soon as the fixture's `await use(...)` begins.
4. No stderr-based rejection is wired up. A crashing Alto will hang until Vitest's `hookTimeout` (45s) fires.

`AltoParameters` has ~40 fields mirroring Alto's CLI. The shared rig only sets the handful shown above; everything else uses Alto's defaults.

## Mock paymaster

The mock paymaster is in its own workspace package `packages/mock-paymaster/`. Entry file `packages/mock-paymaster/index.ts`:

```ts
export const paymaster = defineInstance(
    ({ anvilRpc, altoRpc, port: _port, host: _host = "localhost" }) => {
        const app = Fastify({})
        return {
            _internal: {},
            host: _host,
            port: _port,
            name: "mock-paymaster",
            start: async ({ port = _port }) => {
                const paymasterSigner = createWalletClient({
                    chain: await getChain(anvilRpc),
                    account: privateKeyToAccount(
                        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                    ),
                    transport: http(anvilRpc)
                })

                await setup({ anvilRpc, paymasterSigner: paymasterSigner.account.address })

                app.register(cors, { origin: "*", methods: ["POST", "GET", "OPTIONS"] })

                const rpcHandler = createRpcHandler({ altoRpc, anvilRpc, paymasterSigner })
                app.post("/", {}, rpcHandler)
                app.get("/ping", async (_request, reply) => reply.code(200).send({ message: "pong" }))

                await app.listen({ host: _host, port })
            },
            stop: async () => { app.close() }
        }
    }
)
```

### Endpoints

| Method | Path    | Purpose                                                                                            |
| ------ | ------- | -------------------------------------------------------------------------------------------------- |
| `POST` | `/`     | JSON-RPC handler. Methods include `pm_sponsorUserOperation`, Pimlico ERC-20 quotes, etc. See `packages/mock-paymaster/relay.ts` and siblings. |
| `GET`  | `/ping` | Health check. Returns `{ "message": "pong" }`. Used by `ensurePaymasterIsReady`.                   |

### Paymaster signer

The paymaster uses a fixed key: `0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`. Its Ethereum address is constant and well-known; the paymaster's `setup(...)` call (from `packages/mock-paymaster/setup.ts`) deploys paymaster contracts owned by this key against the local anvil, deposits an initial 50 ETH per EntryPoint, and configures the signer.

The shared rig then tops up the deposit to 1000 ETH per EntryPoint to ensure deposits don't run out across many tests. See [02-lifecycle.md § Paymaster deposit top-up](./02-lifecycle.md#paymaster-deposit-top-up).

### Statelessness

The mock paymaster's Fastify server is effectively stateless per request — it signs sponsorships on demand from the fixed `0xbbbb…bbbb` key. No explicit reset is needed between tests beyond the Alto mempool clear and base fee reset handled by the `testWithRpc` fixture.

## Startup ordering & dependencies

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Anvil      │ ◄── │   Alto       │ ◄── │  Mock paymaster │
│ anvilPort    │     │   altoPort   │     │  paymasterPort  │
└──────────────┘     └──────────────┘     └─────────────────┘
       ▲                   ▲ ▲                 ▲
       │                   │ └─────────────────┤
       │                   │                   │
       │                   │                   └── paymaster.start() calls
       │                   │                       setup(anvilRpc, signerAddr)
       │                   │                       and later serves requests
       │                   │                       that hit altoRpc for RPC fanout
       │                   │
       │                   └── alto boots and queries anvil for chainId,
       │                       registered entrypoints, etc.
       │
       └── setupContracts(anvilRpc): deploys EntryPoints v0.6/0.7/0.8 and
           every smart-account factory before Alto boots.
```

Practical upshot: if you ever rearrange `getSharedRig`, keep the order **anvil → contracts → alto → paymaster → deposit top-up**. Swapping any two will cause one of the processes to make RPC calls against a counterparty that doesn't exist or isn't ready yet.

## Shutdown

When the worker process exits:

```ts
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
```

All three instances are stopped in parallel. `anvilInstance.stop()` and `altoInstance.stop()` kill their subprocesses (via `prool`). `paymasterInstance.stop()` calls `app.close()` on the Fastify server.

→ Next: [04-contracts.md](./04-contracts.md)
