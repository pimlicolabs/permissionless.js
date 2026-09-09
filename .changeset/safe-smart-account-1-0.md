---
"permissionless": major
---

**`SafeSmartAccount` namespace on viem 3.** `toSafeSmartAccount` is now `SafeSmartAccount.from`, imported from the package root; the `permissionless/accounts` and `permissionless/accounts/safe` subpaths are gone. `SafeSmartAccount.signUserOperation` (multi-owner signing) rides the namespace; types move to `SafeSmartAccount.Parameters`, `.ReturnType`, `.Implementation` and `.Version` (was `ToSafeSmartAccountParameters`, `ToSafeSmartAccountReturnType`, `SafeSmartAccountImplementation`, `SafeVersion`).

```ts
import { toSafeSmartAccount } from "permissionless/accounts" // [!code --]
import { SafeSmartAccount } from "permissionless" // [!code ++]

const account = await toSafeSmartAccount({ // [!code --]
const account = await SafeSmartAccount.from({ // [!code ++]
    client,
    owners: [owner],
    version: "1.4.1", // [!code --]
    entryPoint: { address: entryPoint07Address, version: "0.7" }, // [!code --]
    entryPoint: "0.7", // optional; or { address, version } // [!code ++]
})
```

- `owners` stays plural. `entryPoint` (`"0.6"` | `"0.7"`, or `{ address, version }`) and `version` (`"1.4.1"` | `"1.5.0"`) are optional and default to `"0.7"` / `"1.4.1"`; the defaults are frozen for 1.x and counterfactual addresses are unchanged for every parameter set that 0.x supported.
- Nonce key precedence is now per-call key → constructor `nonceKey` → `0n`. 0.x let viem allocate a timestamp-derived key per user operation when `nonceKey` was omitted; omit-both now means key `0n`.
- **Removed `setupTransactions`.** Setup calls change the Safe initializer and therefore the counterfactual address, so no calldata-based replacement can reproduce an address created with it. Put setup calls in the first user operation's `calls` instead. An account already deployed with `setupTransactions` keeps working when you pass its `address` explicitly (no factory data is sent for deployed accounts). An undeployed one cannot reach its 0.x address: deploy it on 0.x first, or accept a new address.
- **Removed the `addModuleLibAddress` alias.** Use `safeModuleSetupAddress`.
- A deployed Safe with `threshold > 1` gets a `verificationGasLimit` floor (`80_000 + 15_000 × threshold`, plus `50_000` for ERC-7579 and `400_000` with a WebAuthn owner) instead of the bundler's estimate. Bundlers estimate against the stub signature, which Safe rejects after the first owner, so verification of the remaining signatures was never counted; 0.x hid the gap behind the extra gas of a fresh timestamp nonce key per user operation.
- Failures throw named error classes (`SafeEntryPointVersionUnsupportedError`, `SafeInsufficientOwnersError`, `SafeWebAuthnSharedSignerAddressMissingError`, …) exported from the package root instead of generic `Error`s.
