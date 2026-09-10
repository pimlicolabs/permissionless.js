---
"permissionless": major
---

**Kernel: `toKernelSmartAccount` → `KernelSmartAccount.from`.** The account is now a namespace exported from the package root; the `permissionless/accounts` subpath is gone.

```ts
import { toKernelSmartAccount } from "permissionless/accounts" // [!code --]
import { KernelSmartAccount } from "permissionless" // [!code ++]
import { entryPoint07Address } from "viem/account-abstraction" // [!code --]

const account = await toKernelSmartAccount({ // [!code --]
    client: publicClient, // [!code --]
    owners: [owner], // [!code --]
    entryPoint: { address: entryPoint07Address, version: "0.7" }, // [!code --]
}) // [!code --]
const account = await KernelSmartAccount.from({ // [!code ++]
    client: publicClient, // [!code ++]
    owner, // [!code ++]
    entryPoint: "0.7", // optional — "0.6" | "0.7" or { address, version } // [!code ++]
}) // [!code ++]
```

- `owner` is singular; the `[owner]` tuple is gone, and the parameter shape no longer changes in EIP-7702 mode.
- `entryPoint` is optional and accepts a version shorthand; it defaults to `0.7`. `version` keeps its derived defaults (`0.3.0-beta` on 0.7, `0.2.2` on 0.6, `0.3.3` with `eip7702: true`); a version the EntryPoint does not support throws `KernelUnsupportedVersionError`.
- `to7702KernelSmartAccount` is removed: pass `eip7702: true` to `KernelSmartAccount.from`. You still own the authorization lifecycle. `accountLogicAddress` is now `implementation`, the same name as on `SimpleSmartAccount.from`.
- `toEcdsaKernelSmartAccount`, its `ecdsaValidatorAddress` alias and its types are removed: the ECDSA validator is the default of `KernelSmartAccount.from`, and it derives the same addresses.
- The automatic vulnerable-validator migration inside `encodeCalls` is removed. Migrate affected accounts on permissionless 0.x first, then upgrade.
- Nonce keys resolve as per-call `key`, then the constructor `nonceKey`, then `0n` (0.x ignored per-call keys). Kernel v3 still packs the key into its 2-byte user-key field and throws `KernelNonceKeyTooLargeError` above `maxUint16`.
- New `KernelSmartAccount.getVersion(client, { address })` reads the deployed Kernel version on-chain; it returns `null` when there is no code at the address and throws `InvalidKernelAccountError` when the contract is not a Kernel.
- Types moved into the namespace: `ToKernelSmartAccountParameters` → `KernelSmartAccount.Parameters`, `ToKernelSmartAccountReturnType` → `KernelSmartAccount.ReturnType`, `KernelSmartAccountImplementation` → `KernelSmartAccount.Implementation`, `KernelVersion` → `KernelSmartAccount.Version`. `KernelSmartAccount.wrapMessageHash`, `.signMessage` and `.signTypedData` stay on the namespace.
- Named errors replace plain `Error`s: `KernelValidatorAddressRequiredError`, `KernelDecodeCallsError`, and the shared `EmptyCallsError`.
- `sign({ hash })` now produces a verifier-compatible ERC-1271 signature: the raw 32-byte hash goes through the account's replay-safe wrapper, so `client.verifyHash` accepts it (0.x signed the hash's hex string, which no verifier accepted). With a WebAuthn owner, `signMessage({ message: { raw } })` now hashes and wraps the raw bytes like a string message instead of signing them as a pre-wrapped digest.
- Counterfactual addresses are unchanged for every explicit `entryPoint` + `version` + `useMetaFactory` combination and for the defaults.
