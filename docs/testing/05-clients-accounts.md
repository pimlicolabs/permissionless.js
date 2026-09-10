# 05 — Clients & account helpers

Every viem client and smart-account helper used in tests lives in `packages/permissionless-test/src/`: the client helpers and the `getCoreSmartAccounts()` matrix in `utils.ts`, one file per account under `accounts/`. This document catalogues them and walks through an end-to-end test.

All helpers take the dynamically-allocated RPC URLs from the `testWithRpc` fixture ([see 02-lifecycle.md](./02-lifecycle.md)). Spread `...rpc` into calls to pass all three.

## The `AAParamType` contract

All account helpers take a config shaped like this (`packages/permissionless-test/src/types.ts`):

```ts
export type AAParamType<entryPointVersion extends EntryPoint.Version> = {
    entryPoint: { version: entryPointVersion }
    anvilRpc: string
    altoRpc: string
    paymasterRpc: string
    privateKey?: Hex.Hex
}
```

- `entryPoint.version` is viem's `EntryPoint.Version`. Each helper narrows it to the versions its account supports, so an unsupported combination is a compile error.
- `privateKey` is optional; every helper defaults to a fresh random key per call (`Secp256k1.randomPrivateKey()` or `Account.random()`), so counterfactual addresses differ per test.

Test bodies get `rpc` from the fixture and spread it:

```ts
const account = await getSimpleClient({
    entryPoint: { version: "0.7" },
    ...rpc // anvilRpc + altoRpc + paymasterRpc from testWithRpc
})
```

## viem base clients

### `getPublicClient(anvilRpc)`

```ts
Client.create({ chain: anvil, transport: http(anvilRpc), pollingInterval: 100 })
    .extend(publicActions())
```

`chain: anvil` matches the chain id Anvil runs with; the aggressive polling suits the instant block time.

### `getAnvilWalletClient({ addressIndex, anvilRpc })`

```ts
Client.create({
    account: Account.fromMnemonic(
        "test test test test test test test test test test test junk",
        { addressIndex }
    ),
    chain: anvil,
    transport: http(anvilRpc)
}).extend(walletActions())
```

Use it when a test needs a plain EOA transaction (fund a smart account, deploy a token, manipulate chain state). Different `addressIndex` values give distinct EOAs with independent nonces.

## ERC-4337 clients

### `getPimlicoClient({ entryPointVersion, altoRpc })`

```ts
PimlicoClient.create({
    chain: anvil,
    entryPoint: {
        address: entryPointAddress(entryPointVersion),
        version: entryPointVersion
    },
    transport: http(altoRpc),
    pollingInterval: 100
})
```

`entryPointAddress` maps `"0.6" | "0.7" | "0.8"` to `EntryPoint.addressV06` / `addressV07` / `addressV08`. Use it for direct Pimlico RPC calls (`pimlico_getUserOperationGasPrice`, `pimlico_getTokenQuotes`, …).

### `getBundlerClient({ altoRpc, anvilRpc, account, paymasterRpc, entryPoint })`

Builds the `SmartAccountClient` most tests send through:

```ts
const paymaster = paymasterRpc
    ? PimlicoClient.create({
          transport: http(paymasterRpc),
          entryPoint: { address, version: entryPoint.version }
      })
    : undefined

const pimlicoBundler = PimlicoClient.create({
    transport: http(altoRpc),
    entryPoint: { address, version: entryPoint.version }
})

return SmartAccountClient.create({
    client: getPublicClient(anvilRpc),
    account,
    paymaster,
    pollingInterval: 100,
    bundlerTransport: createAutoBundleTransport(altoRpc, anvilRpc),
    userOperation: {
        estimateFeesPerGas: async () =>
            (await pimlicoBundler.getUserOperationGasPrice()).fast
    }
})
```

- With `paymasterRpc`, sponsorship goes through the mock paymaster as a `PimlicoClient`.
- Fees come from `pimlico_getUserOperationGasPrice().fast`, as in production.
- `createAutoBundleTransport` (in `testWithRpc.ts`) wraps the Alto transport so tests never wait on a bundler timer.

### `getSmartAccountClient({ altoRpc, anvilRpc, account, paymasterRpc })`

Like `getBundlerClient` but with viem's `PaymasterClient.create` for the paymaster, `chain: anvil` set explicitly, and viem's default fee estimation. The ERC-7579 suites use it.

## Account helpers (`src/accounts/<x>.ts`)

Each file exports the account's helper and a `<x>SmartAccounts: CoreSmartAccount[]` list.

| File | Helper | Builds | Notes |
|------|--------|--------|-------|
| `simple.ts` | `getSimpleClient(conf)` | `SimpleSmartAccount.from({ client, entryPoint: entryPoint.version, owner })` | 0.6, 0.7, 0.8 |
| `simple.ts` | `get7702SimpleClient(conf)` | `SimpleSmartAccount.from({ client, entryPoint: "0.8", eip7702: true, owner })` | 0.8, EIP-7702 |
| `safe.ts` | `getSafeClient({ entryPoint, anvilRpc, erc7579?, privateKey?, owners?, onchainIdentifier?, version? })` | `SafeSmartAccount.from` with `saltNonce: 420n`; `erc7579: true` adds the Safe7579 module `0x7579EE…0002`, launchpad `0x7579011…00ff` and the Rhinestone attester `0x0000003330…084d` (threshold 1) | 1.4.1 on 0.6 and 0.7, 1.5.0 on 0.7 |
| `kernel.ts` | `getKernelClient({ entryPoint, anvilRpc, privateKey?, version?, useMetaFactory?, eip7702? })` | `KernelSmartAccount.from`; `eip7702: true` short-circuits to `{ client, owner, eip7702: true }` (Kernel 0.3.3 on 0.7) | throws `Error("Kernel ERC7579 is not supported for V06")` for 0.3.x on 0.6 |
| `light.ts` | `getLightAccountClient(conf)` | `LightSmartAccount.from({ client, entryPoint: entryPoint.version, owner })` | version derived: 1.1.0 on 0.6, 2.0.0 on 0.7 |
| `trust.ts` | `getTrustClient(conf)` | `TrustSmartAccount.from({ client, owner })` | 0.6 only |
| `nexus.ts` | `getNexusClient(conf)` | `NexusSmartAccount.from({ client, owner })` | 0.7 only |
| `thirdweb.ts` | `getThirdwebClient(conf)` | `ThirdwebSmartAccount.from({ client, entryPoint: entryPoint.version, owner })` | 0.6, 0.7 |
| `etherspot.ts` | `getEtherspotClient({ anvilRpc, privateKey? })` | `EtherspotSmartAccount.from({ client, owner })` | 0.7 only; also exports `validatorAddress` |

## `getCoreSmartAccounts()` — the matrix driver

`utils.ts` concatenates the eight lists. Each entry:

```ts
type CoreSmartAccount = {
    name: string
    supportsEntryPointV06: boolean
    supportsEntryPointV07: boolean
    supportsEntryPointV08: boolean
    isEip7702Compliant?: boolean
    isEip1271Compliant: boolean
    getSmartAccountClient: (conf: AAParamType<EntryPoint.Version>) => Promise<SmartAccountClient.Client<...>>
    getErc7579SmartAccountClient?: (conf) => Promise<SmartAccountClient.Client<...>>
}
```

Current entries (names verbatim from source):

| Name | Supports EP | EIP-7702 | EIP-1271 | ERC-7579 helper |
| ---- | ----------- | -------- | -------- | --------------- |
| Trust | 0.6 | — | yes | — |
| LightAccount 1.1.0 | 0.6 | — | yes | — |
| LightAccount 2.0.0 | 0.7 | — | yes | — |
| Simple | 0.6, 0.7, 0.8 | — | no | — |
| Simple + EIP-7702 | 0.8 | yes | no | — |
| Kernel 0.2.1 / 0.2.2 / 0.2.3 / 0.2.4 | 0.6 | — | yes | — |
| Kernel 7579 0.3.0-beta (non meta factory deployment) | 0.7 | — | yes | yes |
| Kernel 7579 0.3.0-beta | 0.7 | — | yes | yes |
| Kernel 7579 0.3.1 (non meta factory deployment) | 0.7 | — | yes | yes |
| Kernel 7579 0.3.1 / 0.3.2 / 0.3.3 | 0.7 | — | yes | yes |
| Kernel 0.3.3 + EIP-7702 | 0.7 | yes | yes | — |
| Nexus | 0.7 | — | yes | yes |
| Safe | 0.6, 0.7 | — | yes | — |
| Safe 1.5.0 | 0.7 | — | yes | — |
| Safe (with onchain identifier) | 0.6, 0.7 | — | yes | — |
| Safe 1.5.0 (with onchain identifier) | 0.7 | — | yes | — |
| Safe multiple owners | 0.6, 0.7 | — | yes | — |
| Safe 1.5.0 multiple owners | 0.7 | — | yes | — |
| Safe 7579 | 0.7 | — | yes | yes |
| Safe 1.5.0 7579 | 0.7 | — | **no** | yes |
| Safe 7579 Multiple Owners | 0.7 | — | yes | yes |
| Safe 1.5.0 7579 Multiple Owners | 0.7 | — | **no** | yes |
| Etherspot | 0.7 | — | yes | — |
| Thirdweb | 0.6, 0.7 | — | yes | — |

Suites use `describe.each(getCoreSmartAccounts())` to generate the account × EntryPoint product, with `testWithRpc.skipIf(!supportsEntryPointVXX)(...)` disabling the combinations that do not apply.

## Readiness helpers

- `ensureBundlerIsReady({ altoRpc, anvilRpc })` polls `Actions.chains.getId` on a bundler client until Alto responds. Mostly redundant: the fixture already waits.
- `ensurePaymasterIsReady()` polls `GET /ping` on the hard-coded `PAYMASTER_RPC` (`http://localhost:3000`).

Tests rely on the fixture's setup promise and skip these.

## End-to-end walkthrough

`packages/permissionless/actions/smartAccount/sendTransaction.test.ts`, trimmed:

```ts
import { Address } from "viem/utils"
import { describe, expect } from "vitest"
// the custom test fn that provisions { anvilRpc, altoRpc, paymasterRpc }
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts, getPublicClient } from "../../../permissionless-test/src/utils"
import { sendTransaction } from "./sendTransaction"

// one describe block per matrix entry; $name is interpolated by vitest
describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({ getSmartAccountClient, supportsEntryPointV06, isEip7702Compliant }) => {
        // runs only if this account supports EntryPoint 0.6; the rig is not started otherwise
        testWithRpc.skipIf(!supportsEntryPointV06)("sendTransaction_v06", async ({ rpc }) => {
            const smartClient = await getSmartAccountClient({
                entryPoint: { version: "0.6" },
                ...rpc
            })

            // a real user op: estimate → sign → eth_sendUserOperation → bundled → mined → receipt
            const transactionHash = await sendTransaction(smartClient, {
                to: Address.zero,
                data: "0x",
                value: 0n
            })

            expect(transactionHash).toBeTruthy()

            const publicClient = getPublicClient(rpc.anvilRpc)
            const receipt = await publicClient.transaction.getReceipt({ hash: transactionHash })

            expect(receipt.status).toBe("success")
            // ... a second transaction once the account is deployed
        })
        // matching _v07 / _v08 blocks gated on their own flags; EIP-7702 entries also sign an
        // authorization (owner.signAuthorization) and pass it to sendTransaction
    }
)
```

When Vitest runs this file it discovers one `describe` block per entry, up to three `testWithRpc` calls each (0.6 / 0.7 / 0.8), and for every non-skipped test starts the rig once per worker, runs the body, and resets between tests.

## Wiring a new account helper

1. **Deploy its contracts** — see [04-contracts.md § Adding a new contract](./04-contracts.md#adding-a-new-contract).

2. **Add `src/accounts/foo.ts`** with a `getFooClient(conf: AAParamType<...>)` helper that calls `FooSmartAccount.from({ client: getPublicClient(anvilRpc), entryPoint: entryPoint.version, owner })`, and a `fooSmartAccounts: CoreSmartAccount[]` list with the `supportsEntryPointV0X` / `isEip1271Compliant` flags (and `getErc7579SmartAccountClient` for ERC-7579 accounts).

3. **Spread the list** into `getCoreSmartAccounts()` in `utils.ts`.

4. **Run one matrix test** (`bun run test -t "sendTransaction Foo"`) to confirm everything wires up.

→ Next: [06-ci-and-running.md](./06-ci-and-running.md)
