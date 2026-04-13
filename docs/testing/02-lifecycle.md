# 02 — Per-test lifecycle

This document walks through exactly what happens before, during, and after a single test body executes. The protagonist is the `testWithRpc` fixture in `packages/permissionless-test/src/testWithRpc.ts`.

## The fixture

`testWithRpc` is Vitest's `test.extend(...)` applied to produce a custom `test` function that provides a `rpc` fixture. Test files import it like:

```ts
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"

testWithRpc("my test", async ({ rpc }) => {
    const { anvilRpc, altoRpc, paymasterRpc } = rpc
    // ...
})
```

The fixture definition (`packages/permissionless-test/src/testWithRpc.ts:80`):

```ts
let ports: number[] = []

export const testWithRpc = test.extend<{
    rpc: {
        anvilRpc: string
        altoRpc: string
        paymasterRpc: string
    }
}>({
    rpc: async ({}, use) => {
        const altoPort = await getPort({ exclude: ports })
        ports.push(altoPort)
        const paymasterPort = await getPort({ exclude: ports })
        ports.push(paymasterPort)
        const anvilPort = await getPort({ exclude: ports })
        ports.push(anvilPort)

        const anvilRpc     = `http://localhost:${anvilPort}`
        const altoRpc      = `http://localhost:${altoPort}`
        const paymasterRpc = `http://localhost:${paymasterPort}`

        const instances = await getInstances({ anvilPort, altoPort, paymasterPort })

        await use({ anvilRpc, altoRpc, paymasterRpc })

        await Promise.all(instances.map((instance) => instance.stop()))
        ports = ports.filter(
            (port) => port !== altoPort || port !== anvilPort || port !== paymasterPort
        )
    }
})
```

Three things to notice:

1. The whole fixture is a single async function with a single `use(...)` call in the middle. Everything before `use` is **setup**; everything after is **teardown**. Vitest awaits setup, runs the test body (which receives the argument passed to `use`), then awaits teardown.
2. `ports` is a **module-level** `let` array. Each Vitest worker has its own module scope, so this tracker is per-worker.
3. `getInstances(...)` (defined in the same file, `testWithRpc.ts:14`) is where the three processes are actually spawned — covered in [03-infrastructure.md](./03-infrastructure.md).

## Port allocation

`get-port` is used three times in a row, each excluding the previously-allocated ports from the search:

```ts
const altoPort      = await getPort({ exclude: ports })
ports.push(altoPort)
const paymasterPort = await getPort({ exclude: ports })
ports.push(paymasterPort)
const anvilPort     = await getPort({ exclude: ports })
ports.push(anvilPort)
```

`get-port` asks the OS for an available port (by briefly binding to port `0`), so the main source of conflict is an **already-in-use Vitest fixture in the same worker** — which the `exclude` list handles.

### Why `exclude` matters

Without it, the second call could return the port just allocated by the first (since nothing is listening on it yet — the Anvil process hasn't started). Pushing each port onto the tracker and passing `exclude: ports` forces `get-port` to skip them.

### The teardown filter quirk

The filter on teardown (`testWithRpc.ts:121`) is:

```ts
ports = ports.filter(
    (port) => port !== altoPort || port !== anvilPort || port !== paymasterPort
)
```

With three distinct ports, for any element `p` in the array, at most **one** of `p !== altoPort`, `p !== anvilPort`, `p !== paymasterPort` is false — the other two are true, so the `||` short-circuits to true. Every element is kept. In other words, **ports are never removed from the tracker**.

In practice this is harmless because:
- Each Vitest worker serialises tests within a file, so the tracker only grows by 3 per test in that worker.
- `get-port` still asks the OS for a genuinely free port each call; the `exclude` list just adds ports to avoid. Past ports that are now closed don't block the OS from reusing them for later tests — but they do grow the `exclude` array.

If you touch this file, a correct filter would be `p !== altoPort && p !== anvilPort && p !== paymasterPort`. This doc describes current behaviour; any change is out of scope here.

## Setup sequence

`getInstances` (`testWithRpc.ts:14–78`) runs this order — and the order matters:

```
┌── getInstances ──────────────────────────────────────────────────┐
│                                                                  │
│  1. Build AnvilInstance   (forked if VITE_FORK_RPC_URL is set)   │
│  2. Build AltoInstance    (rpcUrl = http://localhost:anvilPort)  │
│  3. Build paymasterInstance (anvilRpc + altoRpc + port)          │
│  4. await anvilInstance.start()                                  │
│  5. if (!forkUrl) await setupContracts(anvilRpc)                 │
│  6. await altoInstance.start()                                   │
│  7. await paymasterInstance.start()                              │
│  8. return [anvilInstance, altoInstance, paymasterInstance]      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Why this order:

- **Anvil must be up before contracts are deployed** — `setupContracts` issues real JSON-RPC transactions.
- **Contracts must exist before Alto starts.** Alto queries the EntryPoint and simulation contracts on boot; if they don't exist yet its RPC will respond with errors when the test tries to `eth_supportedEntryPoints`, etc.
- **Alto must be up before the paymaster starts.** The paymaster calls Alto during setup and during sponsorship. See `packages/mock-paymaster/index.ts:33` where `setup({ anvilRpc, paymasterSigner })` runs before Fastify starts listening.
- If `VITE_FORK_RPC_URL` is set, `setupContracts` is **skipped** — the forked chain already contains all the deployed contracts. See [06-ci-and-running.md § Fork mode](./06-ci-and-running.md#fork-mode).

Contract deployment details are in [04-contracts.md](./04-contracts.md). Process-level details (how `prool` spawns subprocesses, what readiness signals each uses) are in [03-infrastructure.md](./03-infrastructure.md).

## Teardown sequence

After the test body finishes (whether it passed, failed, or threw):

```ts
await Promise.all(instances.map((instance) => instance.stop()))
```

- All three instances are stopped in parallel.
- `anvilInstance.stop()` and `altoInstance.stop()` kill their subprocesses (via `prool`).
- `paymasterInstance.stop()` calls `app.close()` on the Fastify server (`packages/mock-paymaster/index.ts:57`).
- After this, the port-tracker update runs (and as noted above, leaves the tracker unchanged).

If the test body throws **before** `use`'s callback resolves, Vitest still runs teardown. If the teardown itself throws, Vitest reports it as a setup/teardown failure on the test.

## State isolation guarantees

Because every test gets a fresh trio of processes:

| Concern                   | Guarantee                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Chain state               | Fresh genesis (unless fork mode). Block number resets.                                     |
| Account nonces            | Anvil account `0xac097…` and the Rhinestone/Kernel/Alchemy impersonated addresses all start from 0 (or forked nonce). |
| Deployed contract state   | All ERC-4337 contracts are newly deployed → storage is exactly what `setupContracts` writes. |
| Smart-account deployments | Every test creates its own smart account (by private key); counterfactual addresses differ  per-test because `privateKey` defaults to `generatePrivateKey()` in most helpers. |
| Bundler mempool           | Fresh Alto, empty mempool.                                                                 |
| Paymaster nonces          | Fresh wallet tied to the paymaster private key `0xbbbb…bbbb`.                              |
| Ports                     | Distinct for every concurrent test.                                                        |

**Cross-test interference is impossible by construction** — there is no shared mutable state between tests, because there are no shared processes.

## Interaction with `describe.each`

Many tests use `describe.each(getCoreSmartAccounts())` to matrix across every smart-account type. For example, `packages/permissionless/actions/smartAccount/sendTransaction.test.ts:14`:

```ts
describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({ getSmartAccountClient, supportsEntryPointV06, supportsEntryPointV07, supportsEntryPointV08, isEip7702Compliant }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)("sendTransaction_v06", async ({ rpc }) => {
            const smartClient = await getSmartAccountClient({ entryPoint: { version: "0.6" }, ...rpc })
            // ...
        })
        // ...
    }
)
```

Each generated `testWithRpc(...)` call gets its **own** `getInstances` call, not a shared one. So `sendTransaction Safe / sendTransaction_v06` and `sendTransaction Kernel / sendTransaction_v06` each spawn their own anvil/alto/paymaster trio. This is fine because tests within one file run serially ([see 01-architecture.md § Parallelism model](./01-architecture.md#parallelism-model)).

`testWithRpc.skipIf(!supportsEntryPointV06)` is a thin wrapper around Vitest's `test.skipIf`: it short-circuits the whole fixture when the predicate is true, so skipped tests don't pay the setup cost.

## What runs on each port

| Port           | Process              | Primary RPC surface                                                              |
| -------------- | -------------------- | -------------------------------------------------------------------------------- |
| `anvilPort`    | Anvil (via `prool`)  | Standard JSON-RPC (`eth_*`, `anvil_*` cheat codes).                              |
| `altoPort`     | Alto bundler         | ERC-4337 bundler methods (`eth_sendUserOperation`, `eth_estimateUserOperationGas`, `pimlico_*`, etc.). |
| `paymasterPort`| Fastify mock paymaster | `POST /` (RPC handler: `pm_sponsorUserOperation`, `pimlico_getTokenQuotes`, …) and `GET /ping` (health). |

The helper functions that understand these URLs are all in `packages/permissionless-test/src/utils.ts` — covered in [05-clients-accounts.md](./05-clients-accounts.md).

→ Next: [03-infrastructure.md](./03-infrastructure.md)
