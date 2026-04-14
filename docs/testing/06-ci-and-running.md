# 06 — CI & running tests

This document covers the three `test` scripts, CI configuration, environment variables, fork mode, running subsets of tests, and troubleshooting.

## The three test scripts

From `package.json:92–94`:

```json
"test":               "vitest dev -c ./packages/permissionless/vitest.config.ts",
"test:ci-no-coverage": "CI=true && vitest -c ./packages/permissionless/vitest.config.ts --pool=forks",
"test:ci":             "CI=true && vitest -c ./packages/permissionless/vitest.config.ts --coverage --pool=forks"
```

| Script                   | When to use           | Mode                | Coverage                    | Pool            |
| ------------------------ | --------------------- | ------------------- | --------------------------- | --------------- |
| `bun run test`           | Local dev             | `vitest dev` (watch) | text + json + html reporters | default (threads) |
| `bun run test:ci-no-coverage` | Quick full CI-style run locally | one-shot | none                       | `--pool=forks`  |
| `bun run test:ci`        | What CI runs          | one-shot            | lcov only                   | `--pool=forks`  |

Why `--pool=forks`? The default Vitest pool uses worker **threads**; `forks` uses worker **processes**. Because each worker spawns multiple child processes (Anvil, Alto, Fastify) shared across tests and relies on `prool` signal handling, process-pool isolation is safer and more reliable, at the cost of slightly higher memory usage.

The `CI=true &&` prefix in the CI scripts sets the environment variable so `vitest.config.ts:10` picks the lcov-only reporter:

```ts
reporter: process.env.CI ? ["lcov"] : ["text", "json", "html"]
```

## CI workflow

The live CI path is **`.github/workflows/on-pull-request.yml`**, which runs on every PR event:

```yaml
jobs:
  verify:
    uses: ./.github/workflows/verify.yml   # lint + build

  docker-e2e:
    name: E2E-Coverage
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/install-dependencies
      - uses: actions/setup-node@v4
        with: { node-version: "v22.2.0" }
      - run: bun run build
      - run: echo "VITE_FORK_RPC_URL=${{ secrets.VITE_FORK_RPC_URL }}" > .env.test
      - run: bun run test:ci
      - uses: codecov/codecov-action@v3
```

Key points:

- **Node 22.2.0** is used in CI; local dev with a different Node should match this for parity.
- `.env.test` is **generated in-workflow** with `VITE_FORK_RPC_URL` from a GitHub secret. When the secret is unset, the value is empty and `setupContracts` runs normally. When set, Anvil forks that URL and `setupContracts` is skipped ([see fork mode](#fork-mode)).
- Coverage is uploaded to Codecov via `codecov-action@v3`.
- Timeout: 60 minutes.

### The disabled sharded test job

`.github/workflows/verify.yml:77–114` defines a matrix-sharded `test` job (3 shards × 2 transport modes × `nick-fields/retry@v2` with 3 attempts). It's **disabled** by `if: false` at `verify.yml:78` and doesn't currently run. It references `VITE_ANVIL_BLOCK_NUMBER`, `VITE_ANVIL_BLOCK_TIME`, `VITE_ANVIL_FORK_URL`, `VITE_BATCH_MULTICALL`, and `VITE_NETWORK_TRANSPORT_MODE` env vars — but because the job is gated off, these are not live right now. If re-enabled, see the workflow file for the exact env-var names.

## Environment variables

Loaded by Vitest via `loadEnv("test", process.cwd())` (`vitest.config.ts:29`), which reads, in order: `.env.test.local`, `.env.test`, `.env.local`, `.env` (typical Vite precedence). Only variables starting with `VITE_` are exposed to test code via `import.meta.env`.

| Variable                 | Read where                                   | Effect                                                                                   |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_FORK_RPC_URL`      | `testWithRpc.ts`                             | If set, Anvil boots as a fork of this URL and `setupContracts` is **skipped**.           |
| `CI`                     | `vitest.config.ts:10`                        | Switches coverage reporter to `lcov` only.                                               |

Other `VITE_*` vars (`VITE_ANVIL_BLOCK_NUMBER`, `VITE_ANVIL_BLOCK_TIME`, `VITE_NETWORK_TRANSPORT_MODE`, `VITE_BATCH_MULTICALL`, `VITE_ANVIL_FORK_URL`) appear in `verify.yml` but are only consumed by the disabled sharded job. They have no effect in the active `testWithRpc` fixture.

## Fork mode

Set `VITE_FORK_RPC_URL` to any EVM JSON-RPC endpoint (e.g. a mainnet or testnet archive node) to run tests against a forked chain instead of a freshly-deployed one.

Two ways to enable:

```bash
# option A: per-invocation
VITE_FORK_RPC_URL=https://eth.llamarpc.com bun run test

# option B: persistent
echo 'VITE_FORK_RPC_URL=https://eth.llamarpc.com' > .env.test
bun run test
```

Behaviour changes:

- Anvil is started with `forkUrl` set in the shared rig.
- `setupContracts(anvilRpc)` is **not called**. The fork is expected to already contain EntryPoints + factories at their canonical deterministic addresses.
- Alto and the mock paymaster still start normally.
- Paymaster deposits are still topped up (1000 ETH per EntryPoint).

Caveats:

- The fork is created once per worker and shared across all tests in that worker. Tests share the forked chain state.
- If the forked chain's `chainId ≠ foundry.id (31337)`, `eth_chainId` will differ and viem clients configured with `chain: foundry` may misbehave. The shared rig explicitly sets `chainId: foundry.id` on the Anvil instance to paper over this for most cases.
- Smart account addresses computed counterfactually from factory addresses only match reality if the factories on the forked chain match the deterministic-deployer addresses used locally.

## Running subsets

Because `bun run test` runs `vitest dev` (watch mode), it exposes Vitest's interactive filters. You can also pass filters on the CLI:

```bash
# single test file
bun run test packages/permissionless/actions/smartAccount/sendTransaction.test.ts

# by test-name substring
bun run test -t "sendTransaction Safe"

# one matrix entry × one version
bun run test -t "sendTransaction Safe 1.5.0" -t "v07"

# non-watch single run
bun run test:ci-no-coverage packages/permissionless/utils/decodeNonce.test.ts
```

Vitest's interactive keyboard controls in watch mode (`p` for file filter, `t` for test-name filter, `q` to quit, etc.) also work.

## Troubleshooting

### "Server listening at" never appears → `hookTimeout` error

Alto is failing to start silently. The `prool` wrapper listens for the literal string `"Server listening at"` on Alto's stdout (`mock-aa-infra/alto/instance.ts:278`) and does not inspect stderr. If Alto crashes on boot, the hook hangs until the 45s `hookTimeout` fires. This only affects the **first test** in a worker (subsequent tests reuse the already-running Alto).

**Fix:**

1. Uncomment the stderr hooks temporarily:
   ```ts
   altoInstance.on("stderr", (data) => console.error(data.toString()))
   altoInstance.on("stdout", (data) => console.log(data.toString()))
   ```
2. Re-run the failing test to see Alto's error output.
3. Common causes: a contract in `setupContracts` didn't deploy (check `verifyDeployed`'s exit message), port conflict, `@pimlico/alto` version mismatch after a dependency update.

### A contract "NOT DEPLOYED!!!" message

`setupContracts` calls `verifyDeployed` at the end (`mock-aa-infra/alto/index.ts:92`) and `process.exit(1)` for any address with no bytecode. The message identifies the missing address — map it back to the manifest at `mock-aa-infra/alto/index.ts:711–782` to find which contract is missing.

Common causes:
- A new `*_CREATECALL` constant was added but not sent as a transaction in `setupContracts`.
- The creation-call bytes were regenerated with a different salt, changing the deterministic address.
- A dependent contract's batch is missing from `verifyDeployed`'s manifest.

### "AA31 paymaster deposit too low"

This error means the paymaster doesn't have enough ETH deposited in the EntryPoint to cover the gas costs of a user operation.

Common causes:
- **Base fee inflation:** If the base fee reset is missing or broken, gas costs spiral after many mined blocks. Check that `testClient.setNextBlockBaseFeePerGas` runs before each test in the `testWithRpc` fixture.
- **Insufficient deposit top-up:** The shared rig deposits 1000 ETH per EntryPoint at startup. If you're adding many new tests that consume paymaster deposits, you may need to increase this amount in `getSharedRig()`.
- **Wrong paymaster address:** The deposit must go to the correct paymaster contract address (computed via `getSingletonPaymaster0{6,7,8}Address` from `packages/mock-paymaster/constants.ts`).

### Cross-test state contamination

If a test fails with unexpected on-chain state (e.g. "AA13 initCode failed" because an account is already deployed, or EIP-7702 delegation errors):

- **Check for hardcoded private keys.** Tests must use `generatePrivateKey()` to create unique keys. A hardcoded key shared across tests means the same counterfactual address is reused, and one test's deployment/delegation persists into the next.
- **Check key placement.** The `generatePrivateKey()` call should be inside the `describe.each` callback (per account type), not at module level (shared across all account types). EIP-7702 delegation from one account type (e.g. Kernel 0.3.3+EIP-7702) can contaminate another (e.g. Nexus) if they share the same owner key.

### Tests hang or timeout on first test only

The first test in each worker pays the cold-start cost of `getSharedRig()` (anvil boot + contract deployment + alto + paymaster + deposit top-up). This typically takes 10–20s. If it exceeds the 45s `hookTimeout`, the test fails.

**Fix:** Check if `setupContracts` is stalling (usually a contract deployment failure). See the "Server listening at" troubleshooting above.

### Orphaned processes after test run

After a run, check for orphaned processes:

```bash
pgrep -f "alto"   # alto Node process
pgrep -f "anvil"  # anvil
```

The shared rig registers a `process.on("beforeExit")` handler to stop all instances. If the worker is killed abruptly (e.g. `kill -9`), this handler may not run. Kill orphaned processes manually with `kill -9 <pid>`.

### `EADDRINUSE: address already in use`

`get-port` normally prevents this, but if a background process (e.g. a local dev server) grabs the same port between the `getPort()` call and the service actually listening, you'll see this. Re-run; the probability of collision on the retry is negligible. With the shared-rig model, ports are allocated once per worker (not per test), so collisions are even rarer.

### Fork mode: tests that used to pass now fail

Most likely `setupContracts` assumes a clean slate (fresh nonces on Anvil's account 0, etc.), and the forked chain has a different state for that account. Check whether the failing test:

- Uses `getAnvilWalletClient({ addressIndex: 0 })` and expects a specific starting nonce.
- Relies on a factory's *counterfactual* address matching the one `toXxxSmartAccount` computes — the factory must exist on the forked chain.

### Coverage report is missing

If `bun run test:ci` completes but Codecov upload fails or no local `coverage/` appears:

- Running `bun run test` (not `test:ci`) with `process.env.CI` unset produces HTML at `coverage/index.html`.
- `bun run test:ci` only produces `coverage/lcov.info` by design (see reporter switch in `vitest.config.ts:10`).

## Related reading

- [01-architecture.md](./01-architecture.md) — full command chain and vitest config details.
- [02-lifecycle.md](./02-lifecycle.md) — the `testWithRpc` fixture internals.
- [04-contracts.md](./04-contracts.md) — why fork mode can skip `setupContracts`.
