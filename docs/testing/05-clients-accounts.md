# 05 — Clients & account helpers

Every viem client and smart-account factory used in tests lives in one file: `packages/permissionless-test/src/utils.ts` (1,091 lines). This document catalogues them, explains how they compose, and walks through an end-to-end test.

All helpers accept the dynamically-allocated RPC URLs from the `testWithRpc` fixture ([see 02-lifecycle.md](./02-lifecycle.md)). Spread `...rpc` into calls to pass all three.

## The `AAParamType` contract

All account-factory helpers take a config shaped like this (`packages/permissionless-test/src/types.ts:4`):

```ts
export type AAParamType<entryPointVersion extends EntryPointVersion> = {
    entryPoint: { version: entryPointVersion }
    anvilRpc: string
    altoRpc: string
    paymasterRpc: string
    privateKey?: Hex
}
```

- `entryPoint.version` is `"0.6" | "0.7" | "0.8"`. It's a narrow type parameter so callers get a compile error if they try to use an unsupported version for a given account family.
- `privateKey` is optional; every helper defaults to `generatePrivateKey()` if omitted, producing a fresh signer per invocation.

Test bodies almost always get `rpc` from the fixture and spread it:

```ts
const account = await getSimpleAccountClient({
    entryPoint: { version: "0.7" },
    ...rpc            // anvilRpc + altoRpc + paymasterRpc come from testWithRpc
})
```

## Viem base clients

### `getPublicClient(anvilRpc)`

`utils.ts:226`. A viem `PublicClient` against the local Anvil.

```ts
export const getPublicClient = (anvilRpc: string) => {
    const transport = http(anvilRpc, {
        // onFetchRequest / onFetchResponse hooks available for debugging (commented out)
    })
    return createPublicClient({
        chain: foundry,
        transport,
        pollingInterval: 100
    })
}
```

- `chain: foundry` → matches `chainId: foundry.id` set on Anvil.
- `pollingInterval: 100` → aggressive polling; tests wait on receipts often and the block time is effectively instant.
- Commented-out `onFetchRequest` / `onFetchResponse` hooks are left in place for easy RPC-level debugging — uncomment them to dump every request/response.

### `getAnvilWalletClient({ addressIndex, anvilRpc })`

`utils.ts:99`. A viem `WalletClient` backed by one of Anvil's pre-funded mnemonic accounts.

```ts
return createWalletClient({
    account: mnemonicToAccount(
        "test test test test test test test test test test test junk",
        { addressIndex }
    ),
    chain: foundry,
    transport: http(anvilRpc)
})
```

Use this when a test needs to send a regular EOA transaction (e.g. fund a smart account, deploy a token, manipulate chain state). Pass different `addressIndex` values if one test needs multiple EOAs with distinct nonces.

## ERC-4337 clients

### `getPimlicoClient({ entryPointVersion, altoRpc })`

`utils.ts:199`. Wraps `createPimlicoClient(...)` with the right entry-point address resolved from `entryPointVersion`:

```ts
const address = (() => {
    if (entryPointVersion === "0.6") return entryPoint06Address
    if (entryPointVersion === "0.7") return entryPoint07Address
    return entryPoint08Address
})()

return createPimlicoClient({
    chain: foundry,
    entryPoint: { address, version: entryPointVersion },
    transport: http(altoRpc)
})
```

Used when tests need direct access to Pimlico bundler RPC methods (`pimlico_getUserOperationGasPrice`, `pimlico_getTokenQuotes`, etc.).

### `getBundlerClient({ altoRpc, anvilRpc, account, paymasterRpc, entryPoint })`

`utils.ts:115`. Builds a full `SmartAccountClient` ready to send user operations.

```ts
const paymaster = paymasterRpc
    ? createPimlicoClient({
          transport: http(paymasterRpc),
          entryPoint: { address, version: entryPoint.version }
      })
    : undefined

const pimlicoBundler = createPimlicoClient({
    transport: http(altoRpc),
    entryPoint: { address, version: entryPoint.version }
})

return createSmartAccountClient({
    client: getPublicClient(anvilRpc),
    account,
    paymaster,
    bundlerTransport: http(altoRpc),
    userOperation: {
        estimateFeesPerGas: async () => {
            return (await pimlicoBundler.getUserOperationGasPrice()).fast
        }
    }
})
```

Notable:
- If `paymasterRpc` is provided, sponsorship happens via the mock paymaster (tests that exercise the paymaster flow).
- Gas pricing uses `pimlico_getUserOperationGasPrice().fast` instead of eth_gasPrice — matches what Pimlico users do in production.

### `getSmartAccountClient({ altoRpc, anvilRpc, account, paymasterRpc })`

`utils.ts:171`. Similar to `getBundlerClient` but:
- Uses plain `createPaymasterClient(...)` (not the Pimlico variant) for the paymaster transport.
- Does **not** override `estimateFeesPerGas` — the SDK uses defaults.

Used in ERC-7579 tests (install/uninstall modules) where the test doesn't care about Pimlico-specific gas pricing.

## Smart-account factory helpers

All return a `SmartAccount` ready to be plugged into `getBundlerClient(...)` as the `account` field.

### `getSimpleAccountClient(conf)` — `utils.ts:243`

```ts
return toSimpleSmartAccount({
    client: getPublicClient(anvilRpc),
    entryPoint: {
        address: entryPointMapping[entryPoint.version],
        version: entryPoint.version
    },
    owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
})
```

- Supports v0.6 / v0.7 / v0.8.
- EIP-1271: no.

### `get7702SimpleAccountClient(conf)` — `utils.ts:268`

```ts
return to7702SimpleSmartAccount({
    client: getPublicClient(anvilRpc),
    entryPoint: { address: entryPoint08Address, version: "0.8" },
    owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
})
```

- v0.8 only.
- EIP-7702 compliant.

### `getLightAccountClient({ entryPoint, anvilRpc, version, privateKey })` — `utils.ts:282`

- Versions: `"1.1.0"` (default, v0.6), `"2.0.0"` (v0.7).
- EntryPoint: depends on version.
- EIP-1271: yes.

### `getTrustAccountClient(conf)` — `utils.ts:307`

- v0.6 only. EntryPoint hardcoded to v0.6.
- EIP-1271: yes.

### `getBiconomyClient(conf)` — `utils.ts:324`

- v0.6 only. EntryPoint hardcoded to v0.6.
- EIP-1271: yes.
- Signature passed as `owners: [...]` (not `owner`).

### `getNexusClient(conf)` — `utils.ts:340`

- v0.7 only; entryPoint is inferred by `toNexusSmartAccount` itself.
- Hardcoded `version: "1.0.0"`.
- EIP-1271: yes. ERC-7579: yes.

### `getKernelEcdsaClient({ entryPoint, anvilRpc, version, privateKey, useMetaFactory, eip7702 })` — `utils.ts:351`

Most flexible helper:
- Versions: `"0.2.1"`, `"0.2.2"` (default), `"0.2.3"`, `"0.2.4"` (all v0.6); `"0.3.0-beta"`, `"0.3.1"`, `"0.3.2"`, `"0.3.3"` (all v0.7).
- `useMetaFactory: false` → deploys directly via per-version factory; `useMetaFactory: true` (default) → deploys via the meta-factory `0xd703…42d5`.
- `eip7702: true` → short-circuits to `to7702KernelSmartAccount(...)` instead. Ignores `version`; always uses Kernel v0.3.3.
- EIP-1271: yes. ERC-7579: yes (for v0.7 versions).

Throws `Error("Kernel ERC7579 is not supported for V06")` if you ask for a v0.3.x Kernel on EntryPoint v0.6.

### `getSafeClient({ entryPoint, anvilRpc, erc7579, privateKey, owners, onchainIdentifier, version })` — `utils.ts:396`

- Versions: `"1.4.1"` (default) or `"1.5.0"`.
- `owners`: optional array of viem `Account`s. Defaults to `[privateKeyToAccount(privateKey ?? generatePrivateKey())]`.
- `erc7579: true` → uses Safe's 7579 module `0x7579EE…0002` + launchpad `0x7579011…00ff`, configures the Rhinestone attester threshold.
- `onchainIdentifier`: optional partner tag bytes.
- Hardcoded `saltNonce: 420n`.
- EIP-1271: yes (except ERC-7579 Safe 1.5.0 — see `getCoreSmartAccounts` flags).

### `getThirdwebClient(conf)` — `utils.ts:444`

- Versions: hardcoded `"1.5.20"`.
- Supports v0.6 and v0.7 via `entryPoint.version`.
- EIP-1271: yes.

### `getEtherspotClient(conf)` — `utils.ts:470`

- v0.7 only; entryPoint is hardcoded.
- **Ignores `privateKey`** — always generates a fresh key.
- EIP-1271: yes.

## `getCoreSmartAccounts()` — the matrix driver

`utils.ts:485–1091`. Returns an array of **every** account configuration the test suite cares about. Each entry has:

```ts
{
    name: string
    supportsEntryPointV06: boolean
    supportsEntryPointV07: boolean
    supportsEntryPointV08: boolean
    isEip7702Compliant?: boolean
    isEip1271Compliant: boolean
    getSmartAccountClient: (conf: AAParamType<EntryPointVersion>) => Promise<SmartAccountClient<...>>
    getErc7579SmartAccountClient?: (conf) => Promise<SmartAccountClient<...>>
}
```

Current entries (names quoted verbatim from source):

| Name                                                | Supports EP    | EIP-7702 | EIP-1271 | ERC-7579 helper |
| --------------------------------------------------- | -------------- | -------- | -------- | --------------- |
| Trust                                               | v0.6           | —        | yes      | —               |
| LightAccount 1.1.0                                  | v0.6           | —        | yes      | —               |
| LightAccount 2.0.0                                  | v0.7           | —        | yes      | —               |
| Simple                                              | v0.6, v0.7, v0.8 | —      | no       | —               |
| Simple + EIP-7702                                   | v0.8           | yes      | no       | —               |
| Kernel 0.2.1 / 0.2.2 / 0.2.3 / 0.2.4                | v0.6           | —        | yes      | —               |
| Kernel 7579 0.3.0-beta (non meta factory deployment) | v0.7          | —        | yes      | yes             |
| Kernel 7579 0.3.0-beta                              | v0.7           | —        | yes      | yes             |
| Kernel 7579 0.3.1 (non meta factory deployment)     | v0.7           | —        | yes      | yes             |
| Kernel 7579 0.3.1 / 0.3.2 / 0.3.3                   | v0.7           | —        | yes      | yes             |
| Kernel 0.3.3 + EIP-7702                             | v0.7           | yes      | yes      | —               |
| Biconomy                                            | v0.6           | —        | yes      | —               |
| Nexus                                               | v0.7           | —        | yes      | yes             |
| Safe                                                | v0.6, v0.7     | —        | yes      | —               |
| Safe 1.5.0                                          | v0.7           | —        | yes      | —               |
| Safe (with onchain identifier)                      | v0.6, v0.7     | —        | yes      | —               |
| Safe 1.5.0 (with onchain identifier)                | v0.7           | —        | yes      | —               |
| Safe multiple owners                                | v0.6, v0.7     | —        | yes      | —               |
| Safe 1.5.0 multiple owners                          | v0.7           | —        | yes      | —               |
| Safe 7579                                           | v0.7           | —        | yes      | yes             |
| Safe 1.5.0 7579                                     | v0.7           | —        | **no**   | yes             |
| Safe 7579 Multiple Owners                           | v0.7           | —        | yes      | yes             |
| Safe 1.5.0 7579 Multiple Owners                     | v0.7           | —        | **no**   | yes             |
| Etherspot                                           | v0.7           | —        | yes      | —               |
| Thirdweb                                            | v0.6, v0.7     | —        | yes      | —               |

Tests use this with `describe.each(getCoreSmartAccounts())` to generate a Cartesian product of (account × entry-point version). Each inner `testWithRpc.skipIf(!supportsEntryPointVXX)(...)` disables the combos that don't apply.

## Readiness helpers

- `ensureBundlerIsReady({ altoRpc, anvilRpc })` — `utils.ts:61`. Polls `bundlerClient.getChainId()` until Alto responds. Mostly redundant (the fixture already waits).
- `ensurePaymasterIsReady()` — `utils.ts:83`. Polls `GET /ping` on the **hard-coded** `http://localhost:3000` (the `PAYMASTER_RPC` constant at `utils.ts:59`). Works only if a paymaster happens to be on port 3000.

Tests normally rely on the fixture's setup promise and skip these helpers.

## End-to-end walkthrough

A real test annotated line by line. `packages/permissionless/actions/smartAccount/sendTransaction.test.ts:1`:

```ts
import { zeroAddress } from "viem"
import { describe, expect } from "vitest"
// ⬇ the custom test fn that provisions {anvilRpc, altoRpc, paymasterRpc}
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
// ⬇ factory list + helpers
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { sendTransaction } from "./sendTransaction"

// ⬇ one describe block per account configuration.
//   $name is interpolated from `name` on each entry (vitest convention).
describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07,
        supportsEntryPointV08,
        isEip7702Compliant
    }) => {
        // ⬇ runs only if this account supports EntryPoint v0.6.
        //   Whole fixture (anvil/alto/paymaster setup) is skipped otherwise.
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendTransaction_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                // ⬇ Build a SmartAccountClient wired to:
                //   - local anvil   (public/wallet)
                //   - local alto    (bundler, gas price)
                //   - (no paymaster for this test — conf doesn't spread paymasterRpc)
                const smartClient = await getSmartAccountClient({
                    entryPoint: { version: "0.6" },
                    ...rpc
                })

                // ⬇ Sends a real user op: estimate → sign → eth_sendUserOperation to alto
                //   → alto bundles → submits via anvil → txn mined → receipt returned
                const transactionHash = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash).toBeTruthy()

                // ⬇ Independent public client to verify on-chain state
                const publicClient = getPublicClient(anvilRpc)
                const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash })

                expect(receipt).toBeTruthy()
                expect(receipt.status).toBe("success")
                // ... rest of the test: send a second txn after the account is deployed
            }
        )
        // ... corresponding _v07 / _v08 blocks, gated on their own supports flags
    }
)
```

When Vitest runs this file:

1. It discovers N `describe` blocks (one per `getCoreSmartAccounts()` entry).
2. Each block has up to 3 `testWithRpc` calls (v0.6 / v0.7 / v0.8), some of which are skipped.
3. For every non-skipped test: fixture spins up anvil + contracts + alto + paymaster, the body runs, everything stops.
4. Because `sequence.concurrent: false`, tests within this file run one at a time.

Typical wall-clock for this one file: on the order of tens of seconds to a few minutes depending on how many accounts × versions are live.

## Wiring a new account helper

To add support for a new smart-account type:

1. **Deploy its contracts** — see [04-contracts.md § Adding a new contract](./04-contracts.md#adding-a-new-contract).

2. **Add a `get<Name>Client(conf: AAParamType<...>)`** in `utils.ts`. Match the pattern of existing helpers:

   ```ts
   export const getFooClient = async <V extends "0.7">({
       anvilRpc,
       privateKey
   }: AAParamType<V>) => {
       return toFooSmartAccount({
           client: getPublicClient(anvilRpc),
           entryPoint: { address: entryPoint07Address, version: "0.7" },
           owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
       })
   }
   ```

3. **Add a `getCoreSmartAccounts()` entry** if the new type should participate in matrix tests. Set `supportsEntryPointV0X` flags to match reality and provide `getSmartAccountClient` (and `getErc7579SmartAccountClient` if it's an ERC-7579 account).

4. **Run one matrix test** (`bun run test -t "sendTransaction Foo"`) to confirm everything wires up.

→ Next: [06-ci-and-running.md](./06-ci-and-running.md)
