# Test Infrastructure

This directory documents how the `permissionless.js` test suite works end-to-end — from `bun run test` down to the individual user operation flying through a local bundler.

## The short version

Tests in this repository run against a **shared ERC-4337 stack per Vitest worker**:

1. One **Anvil** node (L1 EVM) per worker.
2. One **Alto** bundler (`@pimlico/alto`) pointed at that Anvil.
3. One **mock paymaster** (Fastify server) pointed at both Anvil and Alto.

These three processes are spawned **once per worker** on dynamically-allocated ports when the first test in that worker runs. All core smart-account contracts (EntryPoints v0.6/v0.7/v0.8, SimpleAccount, Safe, Kernel, LightAccount, Biconomy, Trust, Nexus, Etherspot, Thirdweb, ERC-7579 modules, …) are deployed via a deterministic deployer, and paymaster deposits are topped up with 1000 ETH per EntryPoint. Each test receives `{ anvilRpc, altoRpc, paymasterRpc }` to wire up viem clients.

Between tests, the shared infrastructure is reset:
- Alto's mempool and reputation are cleared via `debug_bundler_clearState`.
- The base fee is reset to 1 gwei to prevent EIP-1559 inflation from accumulated mined blocks.

Each test uses a **fresh private key** (`generatePrivateKey()`) so counterfactual smart-account addresses differ per test, providing account-level isolation without restarting processes.

When the worker exits, all three processes are stopped.

## Per-worker lifecycle

```
┌──────────────── worker startup (once) ────────────────────────┐
│                                                                │
│  1. allocate 3 ports via get-port (anvil, alto, paymaster)     │
│  2. start anvil on anvilPort (chainId=foundry, hardfork=Prague)│
│  3. setupContracts(anvilRpc)                                   │
│       └─ ~80 txns to the deterministic deployer +              │
│          a few setCode / impersonateAccount calls              │
│  4. start alto on altoPort (entrypoints: [0.6, 0.7, 0.8],     │
│       enableDebugEndpoints: true)                              │
│  5. start mock-paymaster on paymasterPort                      │
│  6. top up paymaster deposits (1000 ETH per EntryPoint)        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌──────────────── per test ─────────────────────────────────────┐
│                                                                │
│  1. clear alto mempool + reputation (debug_bundler_clearState) │
│  2. reset base fee to 1 gwei + mine a block                   │
│  3. ── test body runs ──                                       │
│     receives: { anvilRpc, altoRpc, paymasterRpc }              │
│     builds: public client, wallet client, bundler client,      │
│             pimlico client, smart account(s), etc.             │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌──────────────── worker shutdown ──────────────────────────────┐
│                                                                │
│  process.on("beforeExit") → stop alto, paymaster, anvil        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## What to read

Read these in order if you're new. Each document is self-contained; cross-links point to the relevant file.

| #   | Doc                                                   | What's in it                                                                          |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 01  | [01-architecture.md](./01-architecture.md)            | `bun run test` command chain, `vitest.config.ts`, file layout, test discovery.        |
| 02  | [02-lifecycle.md](./02-lifecycle.md)                  | The `testWithRpc` fixture: shared rig, per-test reset, state isolation guarantees.    |
| 03  | [03-infrastructure.md](./03-infrastructure.md)        | Anvil, Alto, and the mock paymaster — how each process is spawned and configured.     |
| 04  | [04-contracts.md](./04-contracts.md)                  | `setupContracts`, the deterministic deployer, the full contract catalog, how to add a new one. |
| 05  | [05-clients-accounts.md](./05-clients-accounts.md)    | Every viem/Pimlico/smart-account helper in `packages/permissionless-test/src/utils.ts`. |
| 06  | [06-ci-and-running.md](./06-ci-and-running.md)        | Local vs CI scripts, env vars, fork mode, running single tests, troubleshooting.      |

## "If you want to…" cheat sheet

| Task                                         | Go to                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Understand what `bun run test` actually does | [01-architecture.md](./01-architecture.md)                                   |
| Write a new test                             | [05-clients-accounts.md § End-to-end walkthrough](./05-clients-accounts.md#end-to-end-walkthrough) |
| Support a new smart-account type             | [04-contracts.md § Adding a new contract](./04-contracts.md#adding-a-new-contract) + [05-clients-accounts.md § Wiring a new account helper](./05-clients-accounts.md#wiring-a-new-account-helper) |
| Run tests against a forked network           | [06-ci-and-running.md § Fork mode](./06-ci-and-running.md#fork-mode)          |
| Run a single test / test file                | [06-ci-and-running.md § Running subsets](./06-ci-and-running.md#running-subsets) |
| Debug a hanging test                         | [06-ci-and-running.md § Troubleshooting](./06-ci-and-running.md#troubleshooting) |

## Key files

Everything test-related lives in three packages:

- `packages/permissionless/vitest.config.ts` — the Vitest config that `bun run test` points at.
- `packages/permissionless-test/` — shared fixtures, client helpers, and the mock bundler infra. **Not published; test-only.**
  - `src/testWithRpc.ts` — the `test.extend(...)` fixture with shared per-worker rig, `createAutoBundleTransport`, and per-test reset logic.
  - `src/utils.ts` — every `get*Client`/`get*AccountClient` helper tests reach for.
  - `src/types.ts` — `AAParamType`.
  - `mock-aa-infra/alto/index.ts` — `setupContracts()` that deploys everything.
  - `mock-aa-infra/alto/instance.ts` — the `alto` process wrapper built on `prool`.
  - `mock-aa-infra/alto/constants/` — pre-computed `*_CREATECALL` bytecode used by `setupContracts`.
- `packages/mock-paymaster/` — the Fastify mock paymaster server (also a `prool` instance).

Tests themselves are colocated with source code as `*.test.ts` files under `packages/permissionless/`.
