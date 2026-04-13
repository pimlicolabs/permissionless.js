# 01 — Architecture

This document explains the big picture of `bun run test`: what is actually invoked, how Vitest is configured, where tests live, and how the pieces plug together.

## The command chain

### What `bun run test` runs

From `package.json:92`:

```json
"test": "vitest dev -c ./packages/permissionless/vitest.config.ts"
```

- `bun run test` is just a thin wrapper — `bun` reads `package.json` and executes the string above.
- `vitest dev` starts Vitest in **watch mode** (re-runs on file change) using the specified config file.
- The config file lives **inside the package** being tested (`packages/permissionless/vitest.config.ts`), not at the repo root. This matters because `vitest.config.ts:28` uses `join(__dirname, "./**/*.test.ts")` to build its glob — meaning test discovery is rooted at `packages/permissionless/`, not at the repo root or CWD.

There are two CI variants (also in `package.json`):

```json
"test:ci-no-coverage": "CI=true && vitest -c ./packages/permissionless/vitest.config.ts --pool=forks",
"test:ci":             "CI=true && vitest -c ./packages/permissionless/vitest.config.ts --coverage --pool=forks"
```

CI differences are covered in [06-ci-and-running.md](./06-ci-and-running.md).

### End-to-end flow

```
bun run test
   │
   └─► vitest dev -c packages/permissionless/vitest.config.ts
          │
          ├─ loads vitest.config.ts
          │     - glob:       packages/permissionless/**/*.test.ts
          │     - env:        loadEnv("test", process.cwd())     (→ .env.test, .env)
          │     - environment: node
          │     - sequence.concurrent: false  (tests in file serial)
          │     - fileParallelism:     true   (files run in parallel)
          │     - testTimeout: 60s, hookTimeout: 45s
          │
          ├─ for each test file, in its own worker:
          │     import { testWithRpc } from "…/testWithRpc"
          │     import { getCoreSmartAccounts, ... } from "…/utils"
          │     describe.each(getCoreSmartAccounts())(...)  ← matrix over accounts
          │         testWithRpc("...", async ({ rpc }) => { ... })
          │
          └─ per test() invocation:
                1. testWithRpc fixture allocates 3 ports
                2. spawns anvil → setupContracts → alto → mock-paymaster
                3. awaits the test body with { rpc: { anvilRpc, altoRpc, paymasterRpc } }
                4. stops all 3 instances, releases ports
```

Fixture mechanics are detailed in [02-lifecycle.md](./02-lifecycle.md); process details in [03-infrastructure.md](./03-infrastructure.md).

## `vitest.config.ts` deep dive

The full file (`packages/permissionless/vitest.config.ts:1`):

```ts
import { join } from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        coverage: {
            all: true,
            provider: "v8",
            reporter: process.env.CI ? ["lcov"] : ["text", "json", "html"],
            include: ["**/permissionless/**"],
            exclude: [
                "**/errors/utils.ts",
                "**/*.test.ts",
                "**/permissionless-test/**",
                "**/_cjs/**",
                "**/_esm/**",
                "**/_types/**"
            ]
        },
        sequence: { concurrent: false },
        fileParallelism: true,
        environment: "node",
        testTimeout: 60_000,
        hookTimeout: 45_000,
        include: [join(__dirname, "./**/*.test.ts")],
        env: loadEnv("test", process.cwd())
    }
})
```

Field-by-field:

| Field                       | Value                                            | Why it matters                                                                                                         |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `coverage.provider`         | `"v8"`                                           | V8's native coverage; no Istanbul instrumentation.                                                                     |
| `coverage.reporter`         | `CI ? ["lcov"] : ["text","json","html"]`         | Local dev gets HTML + text output; CI produces only lcov (Codecov-friendly).                                           |
| `coverage.include`          | `["**/permissionless/**"]`                       | Measures coverage of the published package only.                                                                       |
| `coverage.exclude`          | test files, generated `_cjs`/`_esm`/`_types`, test infra | Keeps coverage numbers honest.                                                                                         |
| `sequence.concurrent`       | `false`                                          | Tests inside one file run **sequentially**. Multiple parallel Anvil stacks from one file would risk port exhaustion and noisy logs. |
| `fileParallelism`           | `true`                                           | Separate `.test.ts` files DO run in parallel (in separate workers).                                                    |
| `environment`               | `"node"`                                         | No jsdom; tests run in raw Node.                                                                                       |
| `testTimeout`               | `60_000` (60s)                                   | User operations + bundling + receipts are slow; 60s is the per-test cap.                                               |
| `hookTimeout`               | `45_000` (45s)                                   | The `testWithRpc` fixture setup (anvil + contracts + alto + paymaster) can take tens of seconds cold.                  |
| `include`                   | `join(__dirname, "./**/*.test.ts")`              | Discovery is rooted at `packages/permissionless/` — not the repo root. Tests elsewhere (e.g. `packages/mock-paymaster/`) are **not** picked up. |
| `env`                       | `loadEnv("test", process.cwd())`                 | Reads `.env.test`, `.env.test.local`, `.env`, `.env.local` from the CWD and exposes `VITE_*` vars to tests.            |

### Parallelism model

- **File-level:** parallel. Each `.test.ts` file runs in its own worker, which means each has its own module-level state (including the `ports: number[]` tracker in `testWithRpc.ts:80`). Workers do not share a port list, but `get-port` asks the OS for a free port, so real collisions are rare.
- **Test-level (inside a file):** serial. Each `testWithRpc(...)` inside a file waits for the previous one to tear down before the next starts. That means **within one file, there is never more than one Anvil/Alto/paymaster trio alive at once**.

Combined: at any instant, concurrency ≈ number of `.test.ts` files currently in flight. With Vitest's default worker count (≈ CPU cores), you typically have 4–8 parallel stacks.

### Why `hookTimeout` is 45s

`testWithRpc` setup does, in order:
1. Allocate 3 free ports (ms).
2. Start Anvil (~1–3s cold).
3. Call `setupContracts(anvilRpc)` which issues **~80+ transactions** to the deterministic deployer and a few impersonation + `setCode` calls. With all txns batched via `Promise.all`, this typically lands in 2–8s but can spike.
4. Start Alto (subprocess, waits for `"Server listening at"` message; ~2–5s).
5. Start the paymaster (Fastify boot; ~1s).

On a slow machine or noisy CI runner, cumulative setup > 30s is possible; 45s is the margin.

## File layout

Tests are **colocated with source code**, as `<name>.test.ts` next to `<name>.ts`:

```
packages/permissionless/
├── accounts/
│   ├── decodeCalls.test.ts
│   └── safe/signUserOperation.test.ts
├── actions/
│   ├── erc7579/       ← 8 tests (install/uninstall/supports/etc.)
│   ├── pimlico/       ← 5 tests (gas price, status, sponsor, quotes, …)
│   ├── public/        ← 2 tests (getAccountNonce, getSenderAddress)
│   └── smartAccount/  ← 5 tests (sendTransaction, sendCalls, signMessage, …)
├── experimental/pimlico/utils/
│   └── prepareUserOperationForErc20Paymaster.test.ts
└── utils/             ← 10 tests (nonce enc/dec, hashing, overrides, etc.)
```

Non-exhaustive — see `packages/permissionless/**/*.test.ts` for the full set.

### The `permissionless-test` package

`packages/permissionless-test/` is a **private** workspace package (`"private": true` in its `package.json`) that holds:

| Directory / file                          | Purpose                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `src/testWithRpc.ts`                      | The `testWithRpc` fixture — starts/stops anvil + alto + paymaster.      |
| `src/utils.ts`                            | All viem/Pimlico/smart-account helpers. Re-read this often.             |
| `src/types.ts`                            | `AAParamType<entryPointVersion>`.                                       |
| `mock-aa-infra/alto/instance.ts`          | `alto(...)` prool instance factory.                                     |
| `mock-aa-infra/alto/index.ts`             | `setupContracts(rpc)` — deploys ~everything via the deterministic deployer. |
| `mock-aa-infra/alto/constants/core.ts`    | EntryPoint v0.6/0.7/0.8 creation-call bytecode.                         |
| `mock-aa-infra/alto/constants/accounts/*` | Per-account-family creation-call bytecode (safe, kernel, light, …).     |

It is imported from test files by **relative path** (e.g. `"../../../permissionless-test/src/testWithRpc"`), not by package name.

### The `mock-paymaster` package

`packages/mock-paymaster/` is a local workspace dependency that exports `paymaster(...)` — a prool instance wrapping a Fastify server. It handles ERC-4337 paymaster RPC methods (`pm_sponsorUserOperation`, `pimlico_getTokenQuotes`, …) against the local anvil and alto. See [03-infrastructure.md § Mock paymaster](./03-infrastructure.md#mock-paymaster).

## File-path cheat sheet

| You want to…                             | Open                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Change how tests are discovered / timed out | `packages/permissionless/vitest.config.ts`                                |
| Change the per-test setup/teardown       | `packages/permissionless-test/src/testWithRpc.ts`                         |
| Add a new viem client helper             | `packages/permissionless-test/src/utils.ts`                               |
| Add a new smart account type             | `packages/permissionless-test/src/utils.ts` + `mock-aa-infra/alto/constants/accounts/` + `mock-aa-infra/alto/index.ts` |
| Change how the bundler is started        | `packages/permissionless-test/mock-aa-infra/alto/instance.ts`             |
| Change the mock paymaster's behaviour    | `packages/mock-paymaster/`                                                |
| Change CI flags / env vars               | `.github/workflows/on-pull-request.yml`                                   |

→ Next: [02-lifecycle.md](./02-lifecycle.md)
