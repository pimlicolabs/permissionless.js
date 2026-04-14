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

The fixture definition (`packages/permissionless-test/src/testWithRpc.ts`):

```ts
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
```

Key things to notice:

1. **Shared rig:** `getSharedRig()` returns a lazily-initialized singleton per worker — the anvil/alto/paymaster trio is only started once and reused for all tests in that worker.
2. **Per-test reset:** Before each test, Alto's mempool and reputation are cleared, and the base fee is reset to 1 gwei.
3. **No per-test teardown:** After `use()` returns, there is no cleanup. The shared trio stays up for the next test. Cleanup happens at worker exit.

## The shared rig

The shared rig is a module-level lazy singleton (`testWithRpc.ts`):

```ts
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
        // ... allocate ports, start processes, deploy contracts, top up deposits
    })()
    return sharedRigPromise
}
```

Each Vitest worker has its own module scope, so the `sharedRigPromise` singleton is per-worker. Within one worker, tests are serial (`sequence.concurrent: false`), so there are no race conditions on the shared mutable state.

## Port allocation

Ports are allocated once per worker during rig initialization:

```ts
const anvilPort = await getPort()
const altoPort = await getPort({ exclude: [anvilPort] })
const paymasterPort = await getPort({ exclude: [anvilPort, altoPort] })
```

`get-port` asks the OS for an available port. Each subsequent call excludes previously allocated ports to avoid collisions before the processes actually bind to them. Since ports are only allocated once per worker (not per test), the allocation logic is simple and collision-free.

## Setup sequence (once per worker)

`getSharedRig()` runs this order — and the order matters:

```
┌── getSharedRig ──────────────────────────────────────────────┐
│                                                               │
│  1. Allocate 3 ports (anvil, alto, paymaster)                 │
│  2. Start Anvil (forked if VITE_FORK_RPC_URL is set)          │
│  3. if (!forkUrl) setupContracts(anvilRpc)                    │
│  4. Start Alto (with enableDebugEndpoints: true)              │
│  5. Start mock paymaster                                      │
│  6. Top up paymaster deposits (1000 ETH per EntryPoint)       │
│     └─ depositTo() on each EntryPoint for each paymaster      │
│        address (v0.6, v0.7, v0.8)                             │
│  7. Return shared rig object                                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Why this order:

- **Anvil must be up before contracts are deployed** — `setupContracts` issues real JSON-RPC transactions.
- **Contracts must exist before Alto starts.** Alto queries the EntryPoint and simulation contracts on boot.
- **Alto must be up before the paymaster starts.** The paymaster calls Alto during setup and during sponsorship.
- **Paymaster deposits are topped up last.** The paymaster's `setup()` deploys paymaster contracts; deposits are then added via the EntryPoint's `depositTo()` function.
- If `VITE_FORK_RPC_URL` is set, `setupContracts` is **skipped** — the forked chain already contains all the deployed contracts. See [06-ci-and-running.md § Fork mode](./06-ci-and-running.md#fork-mode).

Contract deployment details are in [04-contracts.md](./04-contracts.md). Process-level details in [03-infrastructure.md](./03-infrastructure.md).

### Paymaster deposit top-up

The mock paymaster's initial `setup()` deposits 50 ETH per EntryPoint, which can be exhausted across many tests sharing the same chain. To prevent "AA31 paymaster deposit too low" errors, the shared rig tops up each paymaster with 1000 ETH:

```ts
const paymasterAddresses = [
    { entryPoint: entryPoint06Address, paymaster: getSingletonPaymaster06Address(signerAddress) },
    { entryPoint: entryPoint07Address, paymaster: getSingletonPaymaster07Address(signerAddress) },
    { entryPoint: entryPoint08Address, paymaster: getSingletonPaymaster08Address(signerAddress) }
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
```

The paymaster signer key (`0xbbbb…bbbb`) is used to compute the deterministic paymaster addresses via `getSingletonPaymaster0{6,7,8}Address()` from `packages/mock-paymaster/constants.ts`.

## Per-test reset

Before each test body runs, two reset operations occur:

### 1. Clear Alto state

```ts
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
```

This clears Alto's in-memory mempool and reputation tracking. It requires `enableDebugEndpoints: true` on the Alto instance.

### 2. Reset base fee

```ts
await testClient.setNextBlockBaseFeePerGas({ baseFeePerGas: 1000000000n }) // 1 gwei
await testClient.mine({ blocks: 1 })
```

With shared infrastructure, each test that sends user operations triggers `debug_bundler_sendBundleNow` followed by `mine({ blocks: 1 })`. Each non-empty mined block increases Anvil's EIP-1559 base fee. Without resetting, the base fee can grow to hundreds of thousands of gwei after many tests, causing "AA31 paymaster deposit too low" errors because the gas cost per user operation becomes enormous.

## Auto-bundle transport

The file also exports `createAutoBundleTransport`, a custom viem transport that makes bundling deterministic and near-instant:

```ts
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
```

This transport wraps Alto's HTTP endpoint and intercepts `eth_sendUserOperation` calls. After forwarding the call, it immediately:
1. Triggers `debug_bundler_sendBundleNow` to bundle the pending user operation.
2. Mines a block to include the bundle transaction.

This eliminates the ~4s wait for Alto's periodic auto-bundling, making each user operation resolve in ~500ms instead of ~4000ms. The `getBundlerClient` and `getSmartAccountClient` helpers in `utils.ts` use this transport by default.

## Worker-level cleanup

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

When the worker process exits, all three instances are stopped in parallel. This ensures no orphaned anvil/alto processes are left behind.

## State isolation guarantees

Because all tests in a worker share the same trio of processes, isolation relies on different mechanisms than a per-test model:

| Concern                   | How it's isolated                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Smart-account addresses   | Each `describe.each(getCoreSmartAccounts())` block generates a fresh `privateKey = generatePrivateKey()`, so counterfactual addresses differ per account type and per test run. |
| Bundler mempool           | `debug_bundler_clearState` is called before each test, clearing pending user operations and reputation tracking. |
| Base fee                  | Reset to 1 gwei before each test to prevent EIP-1559 inflation from prior mined blocks.            |
| Paymaster deposits        | Topped up to 1000 ETH per EntryPoint at worker startup. Sufficient for hundreds of tests.          |
| Chain state (storage, nonces, balances) | **Not reset** between tests. Tests rely on fresh private keys generating unique counterfactual addresses to avoid collisions. On-chain state from prior tests persists but doesn't interfere because each test operates on different accounts. |
| Deployed contract state   | Contracts deployed by `setupContracts` persist across tests. This is desirable — contract setup is the expensive part (~2-8s). |
| Ports                     | Allocated once per worker, distinct from other workers.                                            |

### Important: private key isolation

Tests **must** use `generatePrivateKey()` (from `viem/accounts`) to create unique keys per test or per `describe.each` block. Using a hardcoded private key across tests causes cross-test contamination because:
- The same key produces the same counterfactual smart-account address.
- One test's deployment or EIP-7702 delegation persists and interferes with later tests using that address.

The standard pattern:

```ts
describe.each(getCoreSmartAccounts())(
    "myTest $name",
    ({ getSmartAccountClient, ... }) => {
        const privateKey = generatePrivateKey() // Fresh key per account type
        testWithRpc("test_v07", async ({ rpc }) => {
            const smartClient = await getSmartAccountClient({
                entryPoint: { version: "0.7" },
                privateKey,
                ...rpc
            })
            // ...
        })
    }
)
```

## Interaction with `describe.each`

Many tests use `describe.each(getCoreSmartAccounts())` to matrix across every smart-account type. For example:

```ts
describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({ getSmartAccountClient, supportsEntryPointV06, supportsEntryPointV07, supportsEntryPointV08, isEip7702Compliant }) => {
        const privateKey = generatePrivateKey()
        testWithRpc.skipIf(!supportsEntryPointV06)("sendTransaction_v06", async ({ rpc }) => {
            const smartClient = await getSmartAccountClient({ entryPoint: { version: "0.6" }, privateKey, ...rpc })
            // ...
        })
        // ...
    }
)
```

All generated `testWithRpc(...)` calls share the same anvil/alto/paymaster trio. Each account type within the `describe.each` gets its own `privateKey`, ensuring different counterfactual addresses. Tests within one file run serially ([see 01-architecture.md § Parallelism model](./01-architecture.md#parallelism-model)).

`testWithRpc.skipIf(!supportsEntryPointV06)` is a thin wrapper around Vitest's `test.skipIf`: it short-circuits the whole fixture when the predicate is true, so skipped tests don't pay the reset cost.

## What runs on each port

| Port           | Process              | Primary RPC surface                                                              |
| -------------- | -------------------- | -------------------------------------------------------------------------------- |
| `anvilPort`    | Anvil (via `prool`)  | Standard JSON-RPC (`eth_*`, `anvil_*` cheat codes).                              |
| `altoPort`     | Alto bundler         | ERC-4337 bundler methods (`eth_sendUserOperation`, `eth_estimateUserOperationGas`, `pimlico_*`, `debug_bundler_*`). |
| `paymasterPort`| Fastify mock paymaster | `POST /` (RPC handler: `pm_sponsorUserOperation`, `pimlico_getTokenQuotes`, …) and `GET /ping` (health). |

The helper functions that understand these URLs are all in `packages/permissionless-test/src/utils.ts` — covered in [05-clients-accounts.md](./05-clients-accounts.md).

→ Next: [03-infrastructure.md](./03-infrastructure.md)
