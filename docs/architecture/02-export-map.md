# Export Map

This document is the complete inventory of every entrypoint in the `permissionless` package. Each entry maps to a conditional export in `package.json` serving TypeScript declarations (`_types/`) and ES modules (`_esm/`); the package is ESM-only. The 23 subpaths of 0.x collapsed into five public entrypoints plus the `./_types/*` escape hatch (spec §4, see below); the 0.x deep paths (`accounts`, `actions/pimlico`, `clients/pimlico`, …) and their per-directory proxy `package.json` files are gone.

## Entrypoints

| Entrypoint | Entry file | Contents |
|---|---|---|
| `permissionless` | `index.ts` | 8 account namespaces, `SmartAccountClient`, `Erc7579` + `erc7579Actions()`, smart-account actions, `smartAccountActions()`, `Nonce`, `Owner`, error classes |
| `permissionless/pimlico` | `pimlico/index.ts` | `PimlicoClient`, `Pimlico` + `pimlicoActions()`, `PasskeyServerClient`, `PasskeyServer`, `Erc20Paymaster` |
| `permissionless/etherspot` | `etherspot/index.ts` | `Etherspot` |
| `permissionless/experimental` | `experimental/index.ts` | empty; semver carve-out reserved |
| `permissionless/package.json` | `package.json` | tooling |
| `permissionless/_types/*` | `_types/*.d.ts` | escape hatch for declaration emit; not a public import path |

Every public surface is an ES module namespace (`export * as X from "./…/index.js"`), never a const object, so tree-shaking keeps working. Namespace names never collide with a `viem/erc4337` export (`SmartAccount`, `BundlerClient`, `EntryPoint`, `UserOperation`, …); `index.smoke.test.ts` asserts the inventory below and the collision rule.

---

## `permissionless` (root)

```typescript
import { SafeSmartAccount, SmartAccountClient, Erc7579, Nonce, Owner } from "permissionless"
```

| Symbol | Kind | Module file |
|---|---|---|
| `EtherspotSmartAccount`, `KernelSmartAccount`, `LightSmartAccount`, `NexusSmartAccount`, `SafeSmartAccount`, `SimpleSmartAccount`, `ThirdwebSmartAccount`, `TrustSmartAccount` | namespace | `accounts/<x>/index.ts` via `accounts/index.ts` |
| `SmartAccountClient` | namespace | `clients/smartAccount/index.ts` |
| `smartAccountActions` | decorator | `clients/decorators/smartAccount.ts` |
| `Erc7579` | namespace | `actions/erc7579/index.ts` |
| `erc7579Actions` | decorator factory | `clients/decorators/erc7579.ts` |
| `sendTransaction`, `signMessage`, `signTypedData`, `writeContract` | action | `actions/smartAccount/*.ts` via `actions/index.ts` |
| `getAccountNonce`, `getSenderAddress` | action | `actions/public/*.ts` via `actions/index.ts` |
| `getRequiredPrefund` | function | `utils/getRequiredPrefund.ts` |
| `Nonce` | namespace | `utils/nonce.ts` |
| `Owner` | namespace | `utils/owner.ts` |
| `*Error` classes (see [errors](../types-and-errors/errors.md)) | class | `errors/<module>.ts` via the flat `errors/index.ts` |

Root types: `GetAccountNonceParams`, `GetSenderAddressParams`, `GetRequiredPrefundReturnType`.

### `SmartAccountClient`

| Member | Kind |
|---|---|
| `create(config)` | function |
| `Client<…>` | type (five type parameters; inline-mapped, variance-annotated — #500) |
| `Config<…>` | type |
| `Actions<chain, account>` | type (the `smartAccountActions()` decorator shape) |
| `PrepareUserOperationHook` | type |

### `Erc7579`

Values: `accountId`, `installModule`, `installModules`, `isModuleInstalled`, `supportsExecutionMode`, `supportsModule`, `uninstallModule`, `uninstallModules`, `encodeCalls`, `decodeCalls`, `encodeInstallModule`, `encodeUninstallModule`.

Types: `Actions`, `CallType`, `ExecutionMode`, `ModuleType`, `EncodeCallsParameters`, `DecodeCallsReturnType`, `EncodeInstallModuleParameters`, `EncodeUninstallModuleParameters`, `InstallModuleParameters`, `InstallModulesParameters`, `IsModuleInstalledParameters`, `SupportsExecutionModeParameters`, `SupportsModuleParameters`, `UninstallModuleParameters`, `UninstallModulesParameters`.

### `Nonce` / `Owner`

`Nonce.encode({ key, sequence })`, `Nonce.decode(nonce)`; `Owner.from({ owner, address? })`.

---

## `permissionless/pimlico`

```typescript
import { PimlicoClient, Pimlico, Erc20Paymaster, pimlicoActions } from "permissionless/pimlico"
```

| Symbol | Kind | Module file |
|---|---|---|
| `PimlicoClient` | namespace (`create`, `Client`, `Config`, `Schema`) | `clients/pimlico/index.ts` |
| `Pimlico` | namespace | `actions/pimlico/index.ts` |
| `pimlicoActions` | decorator factory | `clients/decorators/pimlico.ts` |
| `PasskeyServerClient` | namespace (`create`, `Client`, `Config`, `Schema`) | `clients/passkeyServer/index.ts` |
| `PasskeyServer` | namespace | `actions/passkeyServer/index.ts` |
| `Erc20Paymaster` | namespace | `actions/erc20Paymaster/index.ts` |

### `Pimlico`

Values: `sponsorUserOperation`, `getUserOperationGasPrice`, `getUserOperationStatus`, `validateSponsorshipPolicies`.

Types: `Actions`, `SponsorUserOperationParameters`, `SponsorUserOperationReturnType`, `GetUserOperationGasPriceReturnType`, `GetUserOperationStatusParameters`, `GetUserOperationStatusReturnType`, `ValidateSponsorshipPolicies`, `ValidateSponsorshipPoliciesParameters`.

### `PasskeyServer`

Values: `startRegistration`, `verifyRegistration`, `startAuthentication`, `verifyAuthentication`, `getCredentials`.

Types: `Actions`, `StartRegistrationParameters`, `StartRegistrationReturnType`, `VerifyRegistrationParameters`, `VerifyRegistrationReturnType`, `StartAuthenticationReturnType`, `VerifyAuthenticationParameters`, `VerifyAuthenticationReturnType`, `GetCredentialsParameters`, `GetCredentialsReturnType`.

### `Erc20Paymaster`

Values: `prepareUserOperation`, `estimateCost`, `getTokenQuotes`, `balanceOverride`, `allowanceOverride`.

Types: `PrepareUserOperationParameters`, `EstimateCostParameters`, `EstimateCostReturnType`, `GetTokenQuotesParameters`, `GetTokenQuotesReturnType`, `BalanceOverrideParameters`, `AllowanceOverrideParameters`.

---

## `permissionless/etherspot`

```typescript
import { Etherspot } from "permissionless/etherspot"
```

`Etherspot.getUserOperationGasPrice` (Skandha `skandha_getGasPrice`); types `GetUserOperationGasPriceReturnType`, `Schema`.

---

## `permissionless/experimental`

Empty module. Everything exported from here in a future release is exempt from semver.

---

## `permissionless/_types/*`

```json
"./_types/*": {
    "types": "./_types/*.d.ts",
    "default": "./_esm/*.js"
}
```

Not an import path: nothing under it is public and the file layout changes without notice. It exists for `declaration: true` consumers. A module that exports an `.extend()`ed client (`smartAccountClient.extend(erc7579Actions())`) or a bare action method (`smartAccountClient.sendTransaction`) forces tsc to spell out method parameter types that live in files no entrypoint re-exports (`actions/smartAccount/*`, `actions/erc7579/*`, `actions/pimlico/*`, `types/utils`); `extend()` copies the action bag structurally, so the `SmartAccountClient.Actions` alias name is gone. Without this row tsc gives up with TS2742 (TS 5/6) or TS2883 (TS 7) "inferred type cannot be named"; with it the emitted `.d.ts` reads `import("permissionless/_types/actions/smartAccount/sendTransaction").SendTransactionParameters`. viem 3 ships the same row. `.github/fixtures/type-consumer/declaration.extend.ts` is the blocking CI probe.

---

## Conditional export format

```json
"./pimlico": {
    "types": "./_types/pimlico/index.d.ts",
    "default": "./_esm/pimlico/index.js"
}
```

- **`types`** -- TypeScript resolves `.d.ts` files from `_types/`
- **`default`** -- every other condition (`import`, bundlers, Node `require(esm)`) uses `_esm/`

`typesVersions["*"]` mirrors `pimlico`, `etherspot` and `experimental` to their `.d.ts` for `moduleResolution: node10` consumers, which ignore `exports`; the root is covered by the top-level `types` field. `_types/*` has no mirror: node10 finds `_types/<path>.d.ts` on disk by itself, and a `"_types/*"` pattern would also capture the root `types` path (`_types/index.d.ts` → `_types/index.d.ts.d.ts`, TS7016 on `import "permissionless"`). viem needs the mirror only because its declarations live in `dist/`. `.github/fixtures/type-consumer` type-checks the packed tarball under both resolutions.
