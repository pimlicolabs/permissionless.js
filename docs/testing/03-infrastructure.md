# 03 — Infrastructure (Anvil, Alto, mock paymaster)

Three processes are spawned per test. This document describes how each is configured, how they are started and stopped, and what guarantees each provides.

All three are built on [`prool`](https://github.com/wevm/prool), a small library for orchestrating local dev processes (it provides `defineInstance` + an `execa`-based process manager). Each instance exposes `.start()` and `.stop()`.

## Anvil

Spawned in `packages/permissionless-test/src/testWithRpc.ts:29` via `prool/instances`'s built-in `anvil` factory:

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
| `port`        | `anvilPort` (dynamic)                               | See [02-lifecycle.md § Port allocation](./02-lifecycle.md#port-allocation).                        |
| `forkUrl`     | `process.env.VITE_FORK_RPC_URL` (optional)          | If set, Anvil boots as a fork of that chain at its tip.                                            |

### Default funded account

Anvil ships with 10 pre-funded accounts from the mnemonic `test test test test test test test test test test test junk`. The tests care about index 0 in particular:

- Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Address:     `0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266`

This key is used:

1. As the default signer for `walletClient` in `setupContracts` (`mock-aa-infra/alto/index.ts:107`).
2. As Alto's `executorPrivateKeys[0]` and `utilityPrivateKey` (`testWithRpc.ts:22`).
3. Indirectly via `getAnvilWalletClient({ addressIndex: 0 })` helper.

### Fork mode

If `VITE_FORK_RPC_URL` is set in `.env.test` (or process env), Anvil starts as a fork of that URL. The fixture also **skips** `setupContracts(anvilRpc)` (`testWithRpc.ts:70`) because a live network already has the EntryPoints, factories, etc. deployed at their deterministic addresses.

See [06-ci-and-running.md § Fork mode](./06-ci-and-running.md#fork-mode) for usage.

## Alto bundler

The Alto wrapper lives in `packages/permissionless-test/mock-aa-infra/alto/instance.ts`. It is a **custom `prool` instance** (not shipped by `prool` itself) built with `defineInstance` + `execa`.

The test fixture constructs Alto with (`testWithRpc.ts:42`):

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
    utilityPrivateKey: anvilPrivateKey
})
```

| Setting                  | Value                                      | Why                                                                                                   |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `entrypoints`            | `[v0.6, v0.7, v0.8]`                       | Tests exercise all three EntryPoint versions, so Alto must register all three.                        |
| `rpcUrl`                 | `http://localhost:${anvilPort}`            | The chain Alto watches/submits to.                                                                    |
| `executorPrivateKeys`    | `[anvilPrivateKey]`                        | The account(s) that sign handleOps bundle transactions.                                               |
| `utilityPrivateKey`      | `anvilPrivateKey`                          | Alto's utility wallet (refills executors, deploys supporting contracts).                              |
| `safeMode`               | `false`                                    | Skips ERC-4337 validity-rule enforcement. Test-only convenience; do not copy into production configs. |
| `port`                   | `altoPort`                                 | Dynamic per test.                                                                                     |

Using the anvil account 0 key for **both** executor and utility is fine: that account is funded with 10,000 ETH by Anvil, so gas costs are unbounded.

### How `alto` is spawned

From `packages/permissionless-test/mock-aa-infra/alto/instance.ts:244`:

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
                    // Resolve when the process is listening via a "Server listening at" message.
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
4. No stderr-based rejection is wired up (the line `process.stderr.on('data', reject)` is commented out). A crashing Alto will hang until Vitest's `hookTimeout` (45s) fires.

`AltoParameters` (`instance.ts:6–227`) has ~40 fields mirroring Alto's CLI. The test fixture only sets the handful shown above; everything else uses Alto's defaults.

### Readiness helper

Although `prool` already waits for `"Server listening at"`, there's also an independent readiness loop for tests that want belt-and-braces (`packages/permissionless-test/src/utils.ts:61`):

```ts
export const ensureBundlerIsReady = async ({ altoRpc, anvilRpc }) => {
    const bundlerClient = getBundlerClient({ altoRpc, anvilRpc, entryPoint: { version: "0.6" } })
    while (true) {
        try {
            await bundlerClient.getChainId()
            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}
```

It polls `getChainId()` against Alto until it responds. Most tests don't need this because the fixture already waits for Alto to start.

## Mock paymaster

The mock paymaster is in its own workspace package `packages/mock-paymaster/`. Entry file `packages/mock-paymaster/index.ts:10`:

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

The paymaster uses a fixed key: `0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`. Its Ethereum address is constant and well-known; the paymaster's `setup(...)` call (from `packages/mock-paymaster/setup.ts`) is responsible for deploying a paymaster contract owned by this key against the local anvil, funding it, etc.

### Readiness helper

Unlike Alto, `paymaster.start()` does **not** have a stdout-based readiness signal — `app.listen(...)` already awaits server-start, so when `paymasterInstance.start()` resolves, the server is accepting connections. There is still a polling helper in `packages/permissionless-test/src/utils.ts:83`:

```ts
export const ensurePaymasterIsReady = async () => {
    while (true) {
        try {
            const res = await fetch(`${PAYMASTER_RPC}/ping`)
            const data = await res.json()
            if (data.message !== "pong") throw new Error("nope")
            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}
```

**Caveat:** this helper uses the constant `PAYMASTER_RPC = "http://localhost:3000"` (`utils.ts:59`), **not** the dynamically-allocated `paymasterRpc` from the fixture. So it only works if a paymaster happens to be listening on port 3000. Prefer relying on the fixture's guarantee that the server is live by the time the test body runs.

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

Practical upshot: if you ever rearrange `getInstances`, keep the order **anvil → contracts → alto → paymaster**. Swapping any two will cause one of the processes to make RPC calls against a counterparty that doesn't exist or isn't ready yet.

→ Next: [04-contracts.md](./04-contracts.md)
