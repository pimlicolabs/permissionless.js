# 04 — Contract injection

After Anvil boots but before Alto starts, the fixture calls `setupContracts(anvilRpc)` from `packages/permissionless-test/mock-aa-infra/alto/index.ts:105`. This function deploys every ERC-4337 contract the tests need — around 60+ contracts in total — using **deterministic deployers**, so they end up at the same addresses every time.

Skipped entirely when `VITE_FORK_RPC_URL` is set (see [03-infrastructure.md § Fork mode](./03-infrastructure.md#fork-mode)).

## The deployment strategy

`setupContracts` uses three mechanisms, in combination:

### 1. Deterministic Deployer (Arachnid's `0x4e59b44847…`)

The Arachnid proxy exists on mainnet at `0x4e59b44847b379578588920ca78fbf26c0b4956c` and is preinstalled on Anvil. A transaction to this address with `data = <salt (32 bytes)> + <initcode>` performs a CREATE2 with `msg.sender = 0x4e59…` → the resulting contract address is a deterministic function of `(salt, initcode)`. The pre-packaged creation-call bytes are stored as `*_CREATECALL` constants and sent as-is.

`packages/permissionless-test/mock-aa-infra/alto/index.ts:87`:

```ts
const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
```

Typical usage (`index.ts:132`):

```ts
walletClient.sendTransaction({
    to: DETERMINISTIC_DEPLOYER,
    data: ENTRY_POINT_V08_CREATECALL,
    gas: 15_000_000n,
    nonce: nonce++
}),
```

### 2. Safe Singleton Factory (`0x914d7Fec…`)

Safe's equivalent of Arachnid, at `0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7`. It isn't native to Anvil, so its bytecode is injected via `anvil_setCode` cheat code **before** it's used (`index.ts:127`):

```ts
await anvilClient.setCode({
    address: SAFE_SINGLETON_FACTORY,
    bytecode: SAFE_SINGLETON_FACTORY_BYTECODE
})
```

Then transactions to this address deploy Safe-family contracts deterministically.

### 3. Biconomy Singleton Factory (`0x988C…`)

Same pattern — Biconomy has its own singleton factory (`0x988C135a1049Ce61730724afD342fb7C56CD2776`). Its bytecode is also injected via `setCode` (`index.ts:498`):

```ts
await anvilClient.setCode({
    address: BICONOMY_SINGLETON_FACTORY,
    bytecode: BICONOMY_SINGLETON_FACTORY_BYTECODE
})
```

### 4. Impersonation

A few contracts (Kernel factories, the LightAccount v2 factory's owner-only init, the Rhinestone attester's registration/attestation calls) require calls from specific privileged addresses that the tests don't own keys to. The function uses `anvil_impersonateAccount` + `anvil_setBalance` cheat codes to pretend to be those addresses:

```ts
const rhinestoneAttester = "0x000000333034E9f539ce08819E12c1b8Cb29084d"
await anvilClient.setBalance({ address: rhinestoneAttester, value: parseEther("100") })
await anvilClient.impersonateAccount({ address: rhinestoneAttester })
// ... sendTransaction({ account: rhinestoneAttester, ... })
await anvilClient.stopImpersonatingAccount({ address: rhinestoneAttester })
```

Used for:
- `0x000000333034E9f539ce08819E12c1b8Cb29084d` — Rhinestone attester for ERC-7579 module schema/resolver/attestation (`index.ts:562–603`).
- `0x9775137314fE595c943712B0b336327dfa80aE8A` — Kernel factory owner (calls `setImplementation` on Kernel v0.6 + v0.7 factories, `index.ts:606–687`).
- `0xDdF32240B4ca3184De7EC8f0D5Aba27dEc8B7A5C` — Alchemy LightAccount client owner, used to configure LightAccount v2.0.0 (`index.ts:690–709`).

## Phases

`setupContracts` is organised in roughly four phases:

1. **Cheat-code prelude.** Set the Safe singleton factory's bytecode.
2. **Batch deploy (first `Promise.all`).** ~50 transactions deploying EntryPoints, Simple/Safe/Kernel/Light/Trust/Thirdweb/Nexus-bootstrap factories and validators. All sent in parallel with explicit incrementing nonces so Anvil can order them.
3. **Batch deploy (second `Promise.all`).** ~10 more transactions for Safe proxy factory + singleton + multiSend, Etherspot, Safe 7579 module/launchpad.
4. **Biconomy factory seed + Biconomy/Nexus deploys.** Inject Biconomy singleton factory bytecode, then another parallel batch of 8 deploys through it.
5. **Privileged registrations.** Rhinestone attester registers the ERC-7579 test-module schema/resolver/attestation; Kernel factory owner registers all Kernel implementations; Alchemy owner initializes LightAccount v2.0.0.
6. **`verifyDeployed(...)`.** Reads bytecode at every expected address and `process.exit(1)` if any is missing — fast fail rather than a confusing test error later.

The final verified address list is in `index.ts:711–782` and functions as a self-documenting manifest of what gets deployed.

## Everything that gets deployed

Grouped by account family. Source constants live in `packages/permissionless-test/mock-aa-infra/alto/constants/`.

| Category                | Contracts (deterministic addresses)                                                                                                                                                                                                                      | Source constants file            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| EntryPoints             | v0.6 `0x5FF1…2789`, v0.7 `0x0000…0032`, v0.8 `0x4337…f108`                                                                                                                                                                                                 | `constants/core.ts`              |
| Deterministic deployers | Arachnid `0x4e59…956c` (native to Anvil), Safe singleton factory `0x914d…43d7`, Biconomy singleton factory `0x988C…2776`                                                                                                                                   | `constants/core.ts`              |
| Simple Account          | v0.6 factory `0x9406…6454`, v0.7 factory `0x91E6…8985`, v0.8 factory `0x13E9…5944` + v0.8 impl `0xe6Ca…555B`                                                                                                                                                | `constants/accounts/simple.ts`   |
| Safe (ERC-4337 modules) | v0.6 module setup `0x8EcD…34eb` + module `0xa581…4037`, v0.7 module setup `0x2dd6…5b47` + module `0x75cf…c226`, proxy factory `0x4e1D…ec67`, singleton `0x4167…461a`, multiSend `0x3886…3526`, multiSend-call-only `0x9641…2e02`, Safe 1.5.0 proxy/singleton/send/multisend (`0x14F2…5e7b`, `0xFf51…a44b`, `0x2185…7eB7`, `0xA83c…1836`) | `constants/accounts/safe.ts`     |
| Safe + ERC-7579         | 7579 module `0x7579…0002`, 7579 launchpad `0x7579…00ff`, registry `0x0000…51B2` + schema/resolver/proxies                                                                                                                                                  | `constants/accounts/safe.ts`     |
| Kernel v0.6 (v2.x)      | Account logic v2.1/2.2/2.3/2.4, ECDSA validator v2.2, factory `0x5de4…Ae3`                                                                                                                                                                                 | `constants/accounts/kernel.ts`   |
| Kernel v0.7 (v3.x)      | Account logic v3.0/3.1/3.2/3.3, factories for each, meta-factory `0xd703…42d5`, ECDSA validators v3.0/v3.1, WebAuthn validator v3.1                                                                                                                         | `constants/accounts/kernel.ts`   |
| LightAccount            | v1.1.0 factory `0x0000…0D20` + impl `0xae8c…3cba`, v2.0.0 factory `0x0000…BC24` + impl `0x8E8e…13C7`                                                                                                                                                         | `constants/accounts/light.ts`    |
| Biconomy                | ECDSA Ownership Registry module `0x0000…Ea8e`, Account logic v2 `0x0000…423ac`, factory `0x0000…34F5`, default fallback handler `0x0bBa…83C1`                                                                                                              | `constants/accounts/biconomy.ts` |
| Trust                   | Factory `0x729c…272a`, diamond facets (AccountFacet, DiamondCut, DiamondLoupe, TokenReceiver), Secp256k1VerificationFacet, DefaultFallbackHandler                                                                                                         | `constants/accounts/trust.ts`    |
| Thirdweb                | v0.6 factory `0x85e2…DF00`, v0.7 factory `0x4be0…DCEB`                                                                                                                                                                                                     | `constants/accounts/thirdweb.ts` |
| Etherspot               | Factory `0x2A40…B451`, bootstrap `0x0D51…C8AA`, multiple-owner ECDSA validator `0x0740…1906`, implementation `0x339e…A7b0`                                                                                                                                 | `constants/accounts/etherspot.ts`|
| Nexus                   | K1 validator `0x0000…1E8f`, K1 validator factory `0x0000…DB55`, account impl `0x0000…58f7`, account bootstrapper `0x0000…73d3`, bootstrap lib `0x6c77…39c0`                                                                                                  | `constants/accounts/nexus.ts`    |
| ERC-7579 test module    | `0x4Fd8…8354` (registered + attested by the Rhinestone attester)                                                                                                                                                                                           | `constants/core.ts`              |

The authoritative list with every address is in `verifyDeployed(client, [...])` at `mock-aa-infra/alto/index.ts:711–782`. If this doc and that list disagree, the code wins.

## Why pre-computed creation calls?

Each `*_CREATECALL` constant is literally a hex string: `<salt (32 bytes)><initcode>`. These aren't re-derived from Solidity source at test time — they are checked-in pre-computed values. Benefits:

- **Hermetic.** Tests don't need `forge build` / `solc` available on the developer's machine.
- **Deterministic addresses.** Because both salt and initcode are frozen, every test run produces the same contract addresses. Viem clients and generated `entryPoint06Address` / `entryPoint07Address` / `entryPoint08Address` constants from `viem/account-abstraction` match.
- **Fast.** ~80 `sendTransaction` calls against a local Anvil complete in a couple of seconds.

Downside: updating a contract means regenerating its creation-call bytes. There is (at time of writing) no in-repo script to regenerate them — new creation-calls are produced outside the repo and checked in as hex.

## Adding a new contract

To add a new contract to every test's pre-deployed set:

1. **Produce the creation-call bytes.** Take the contract's creation bytecode, prepend a 32-byte salt (by convention, zeros or a project-specific constant), and store it as a `0x…` hex string in `packages/permissionless-test/mock-aa-infra/alto/constants/accounts/<family>.ts` (or `core.ts` for shared infra).

   ```ts
   export const MYNEWFACTORY_V1_CREATECALL = "0x<salt><initcode>" as const
   ```

   Re-export it from `constants/index.ts`.

2. **Add a deploy call** in `setupContracts` at `mock-aa-infra/alto/index.ts`. Choose which batch to join (first or second `Promise.all`) based on whether it has dependencies on anything in the first batch. If the contract requires the Safe or Biconomy singleton factory, use that as `to`; otherwise use `DETERMINISTIC_DEPLOYER`.

   ```ts
   walletClient.sendTransaction({
       to: DETERMINISTIC_DEPLOYER,
       data: MYNEWFACTORY_V1_CREATECALL,
       gas: 15_000_000n,
       nonce: nonce++
   }),
   ```

3. **Add a post-deployment privileged step** if needed. If your contract requires calls from a specific owner address before it's usable (like Kernel factories), use the `impersonateAccount` / `stopImpersonatingAccount` / `setBalance` pattern already in the file.

4. **Add the expected address to `verifyDeployed`** at the bottom of `setupContracts` so boot fails loudly if deployment silently fails.

5. **Add a helper** in `packages/permissionless-test/src/utils.ts` for creating client/account instances — see [05-clients-accounts.md § Wiring a new account helper](./05-clients-accounts.md#wiring-a-new-account-helper).

6. **Register it with `getCoreSmartAccounts()`** if it should participate in the matrix tests.

## Things that will surprise you

- **All transactions share one nonce counter.** `setupContracts` fetches the starting nonce once (`const nonce = await client.getTransactionCount(...)`) then increments it locally for every `sendTransaction` call. All calls in a `Promise.all` batch are created synchronously, so the nonces are correct — but if you refactor to make batch creation async, you must serialize nonce assignment.
- **`gas: 15_000_000n` is hardcoded everywhere.** Anvil's block gas limit is 30M by default; 15M per txn is ample for creation calls. Don't reduce this casually; some initcodes are large.
- **Batches run in parallel but `Promise.all`.** If *any* transaction fails, the entire setup aborts. The logs will show the failing address because `verifyDeployed` calls `process.exit(1)` and prints the missing address.
- **The Rhinestone attester impersonation injects ~2KB of call data per registration.** These are real calldata blobs for module schema/resolver/attestation registrations; if the upstream registry changes its ABI, these hex strings will need to be regenerated.

→ Next: [05-clients-accounts.md](./05-clients-accounts.md)
