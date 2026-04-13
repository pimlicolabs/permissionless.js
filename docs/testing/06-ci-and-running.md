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

Why `--pool=forks`? The default Vitest pool uses worker **threads**; `forks` uses worker **processes**. Because each test spawns multiple child processes (Anvil, Alto, Fastify) and relies on `prool` signal handling, process-pool isolation is safer and more reliable, at the cost of slightly higher memory usage.

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
| `VITE_FORK_RPC_URL`      | `testWithRpc.ts:25`                          | If set, Anvil boots as a fork of this URL and `setupContracts` is **skipped**.           |
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

- Anvil is started with `forkUrl` set (`testWithRpc.ts:29`).
- `setupContracts(anvilRpc)` is **not called** (`testWithRpc.ts:70`). The fork is expected to already contain EntryPoints + factories at their canonical deterministic addresses.
- Alto and the mock paymaster still start normally.

Caveats:

- The fork is recreated per-test, so every test issues a fresh set of forked reads. Use a reliable/high-rate archive node or expect throttling.
- If the forked chain's `chainId ≠ foundry.id (31337)`, `eth_chainId` will differ and viem clients configured with `chain: foundry` may misbehave. The test fixture explicitly sets `chainId: foundry.id` on the Anvil instance to paper over this for most cases.
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

Alto is failing to start silently. The `prool` wrapper listens for the literal string `"Server listening at"` on Alto's stdout (`mock-aa-infra/alto/instance.ts:278`) and does not inspect stderr. If Alto crashes on boot, the hook hangs until the 45s `hookTimeout` fires.

**Fix:**

1. Uncomment the stderr hooks in `testWithRpc.ts:55–60` temporarily:
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

### Tests hang on teardown

If `.stop()` on one of the instances hangs, the per-test hook times out. Usually caused by a zombie child process from a prior run. Find and kill it:

```bash
pgrep -f "alto"   # alto Node process
pgrep -f "anvil"  # anvil
pgrep -f "node.*mock-paymaster"  # mock paymaster
```

Then `kill -9 <pid>` and retry.

### `EADDRINUSE: address already in use`

`get-port` normally prevents this, but if a background process (e.g. a local dev server) grabs the same port between the `getPort()` call and the service actually listening, you'll see this. Re-run; the probability of collision on the retry is negligible.

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
