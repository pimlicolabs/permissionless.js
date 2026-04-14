# Export Map

This document is the complete inventory of every subpath export in the `permissionless` package. Each entry maps to a conditional export in `package.json` serving TypeScript declarations (`_types/`), ES modules (`_esm/`), and CommonJS (`_cjs/`).

## Subpath Summary

| Subpath | Entry File | Description |
|---------|-----------|-------------|
| `.` | `index.ts` | Utils + errors + clients |
| `./accounts` | `accounts/index.ts` | 12 smart account factories |
| `./accounts/safe` | `accounts/safe/index.ts` | Safe-specific helpers |
| `./actions` | `actions/index.ts` | Public actions |
| `./actions/erc7579` | `actions/erc7579.ts` | ERC-7579 module management |
| `./actions/pimlico` | `actions/pimlico.ts` | Pimlico bundler/paymaster |
| `./actions/smartAccount` | `actions/smartAccount.ts` | Smart account actions |
| `./actions/etherspot` | `actions/etherspot.ts` | Etherspot bundler |
| `./actions/passkeyServer` | `actions/passkeyServer.ts` | Passkey authentication |
| `./clients` | `clients/index.ts` | Client creation |
| `./clients/pimlico` | `clients/pimlico.ts` | Pimlico client |
| `./clients/passkeyServer` | `clients/passkeyServer.ts` | Passkey server client |
| `./utils` | `utils/index.ts` | Utility functions |
| `./errors` | `errors/index.ts` | Error classes |
| `./experimental/pimlico` | `experimental/pimlico/index.ts` | Experimental features |

---

## `permissionless` (root)

```typescript
import { createSmartAccountClient, deepHexlify, AccountNotFoundError } from "permissionless"
```

Re-exports everything from `utils/index.ts`, `errors/index.ts`, and `clients/index.ts`.

### Functions

| Symbol | Kind | Source |
|--------|------|--------|
| `createSmartAccountClient` | function | `clients/createSmartAccountClient.ts` |
| `smartAccountActions` | decorator | `clients/decorators/smartAccount.ts` |
| `deepHexlify` | function | `utils/deepHexlify.ts` |
| `transactionReceiptStatus` | constant | `utils/deepHexlify.ts` |
| `getAddressFromInitCodeOrPaymasterAndData` | function | `utils/getAddressFromInitCodeOrPaymasterAndData.ts` |
| `getRequiredPrefund` | function | `utils/getRequiredPrefund.ts` |
| `isSmartAccountDeployed` | function | `utils/isSmartAccountDeployed.ts` |
| `toOwner` | function | `utils/toOwner.ts` |
| `decodeNonce` | function | `utils/decodeNonce.ts` |
| `encodeNonce` | function | `utils/encodeNonce.ts` |
| `encodeInstallModule` | function | `utils/encodeInstallModule.ts` |
| `encodeUninstallModule` | function | `utils/encodeUninstallModule.ts` |
| `getPackedUserOperation` | function | `utils/getPackedUserOperation.ts` |
| `encode7579Calls` | function | `utils/encode7579Calls.ts` |
| `decode7579Calls` | function | `utils/decode7579Calls.ts` |
| `erc20AllowanceOverride` | function | `utils/erc20AllowanceOverride.ts` |
| `erc20BalanceOverride` | function | `utils/erc20BalanceOverride.ts` |
| `getOxExports` | function | `utils/ox.ts` |
| `hasOxModule` | function | `utils/ox.ts` |
| `AccountNotFoundError` | class | `errors/index.ts` |

### Types

| Symbol | Kind | Source |
|--------|------|--------|
| `SmartAccountClient` | type | `clients/createSmartAccountClient.ts` |
| `SmartAccountClientConfig` | type | `clients/createSmartAccountClient.ts` |
| `SmartAccountActions` | type | `clients/decorators/smartAccount.ts` |
| `GetRequiredPrefundReturnType` | type | `utils/getRequiredPrefund.ts` |
| `EncodeInstallModuleParameters` | type | `utils/encodeInstallModule.ts` |
| `EncodeUninstallModuleParameters` | type | `utils/encodeUninstallModule.ts` |
| `EncodeCallDataParams` | type | `utils/encode7579Calls.ts` |
| `DecodeCallDataReturnType` | type | `utils/decode7579Calls.ts` |
| `Erc20AllowanceOverrideParameters` | type | `utils/erc20AllowanceOverride.ts` |
| `Erc20BalanceOverrideParameters` | type | `utils/erc20BalanceOverride.ts` |

---

## `permissionless/accounts`

```typescript
import { toSimpleSmartAccount, toSafeSmartAccount } from "permissionless/accounts"
```

### Functions

| Symbol | Description |
|--------|-------------|
| `toSimpleSmartAccount` | Create a Simple smart account (EntryPoint 0.6/0.7/0.8) |
| `to7702SimpleSmartAccount` | Create a Simple smart account with EIP-7702 |
| `toLightSmartAccount` | Create a Light Account |
| `toSafeSmartAccount` | Create a Safe smart account |
| `toKernelSmartAccount` | Create a Kernel smart account |
| `toEcdsaKernelSmartAccount` | Create a Kernel account with ECDSA validator |
| `to7702KernelSmartAccount` | Create a Kernel account with EIP-7702 |
| `toBiconomySmartAccount` | Create a Biconomy smart account |
| `toTrustSmartAccount` | Create a Trust wallet smart account |
| `toEtherspotSmartAccount` | Create an Etherspot smart account |
| `toNexusSmartAccount` | Create a Nexus modular smart account |
| `toThirdwebSmartAccount` | Create a Thirdweb smart account |

### Types (per account)

Each account exports three types following the pattern:
- `To<Name>SmartAccountParameters` -- factory input
- `To<Name>SmartAccountReturnType` -- factory output
- `<Name>SmartAccountImplementation` -- implementation type

Plus version-specific types: `SafeVersion`, `LightAccountVersion`, `KernelVersion`.

---

## `permissionless/accounts/safe`

```typescript
import { SafeSmartAccount } from "permissionless/accounts/safe"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `SafeSmartAccount` | object | Contains `toSafeSmartAccount` and `signUserOperation` |
| `SafeSmartAccountImplementation` | type | Implementation type |
| `SafeVersion` | type | `"1.4.1" \| "1.5.0"` |
| `ToSafeSmartAccountParameters` | type | Factory parameters |
| `ToSafeSmartAccountReturnType` | type | Factory return type |

---

## `permissionless/actions`

```typescript
import { getAccountNonce, getSenderAddress } from "permissionless/actions"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `getAccountNonce` | function | Get nonce from EntryPoint |
| `getSenderAddress` | function | Get counterfactual address from init code |
| `InvalidEntryPointError` | class | Thrown when getSenderAddress fails |
| `GetAccountNonceParams` | type | Parameters for getAccountNonce |
| `GetSenderAddressParams` | type | Parameters for getSenderAddress |

---

## `permissionless/actions/erc7579`

```typescript
import { erc7579Actions, installModule } from "permissionless/actions/erc7579"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `erc7579Actions` | decorator factory | Returns decorator adding all ERC-7579 methods |
| `accountId` | function | Get account's ERC-7579 ID |
| `installModule` | function | Install a single module |
| `installModules` | function | Install multiple modules |
| `isModuleInstalled` | function | Check if module is installed |
| `supportsExecutionMode` | function | Check execution mode support |
| `supportsModule` | function | Check module type support |
| `uninstallModule` | function | Uninstall a single module |
| `uninstallModules` | function | Uninstall multiple modules |
| `Erc7579Actions` | type | Actions object type |
| `InstallModuleParameters` | type | Install params |
| `InstallModulesParameters` | type | Batch install params |
| `IsModuleInstalledParameters` | type | Query params |
| `SupportsExecutionModeParameters` | type | Query params |
| `SupportsModuleParameters` | type | Query params |
| `UninstallModuleParameters` | type | Uninstall params |
| `UninstallModulesParameters` | type | Batch uninstall params |
| `CallType` | type | `"call" \| "batchcall" \| "delegatecall"` |
| `ExecutionMode` | type | Execution mode descriptor |
| `ModuleType` | type | `"validator" \| "executor" \| "fallback" \| "hook"` |

---

## `permissionless/actions/pimlico`

```typescript
import { pimlicoActions, sponsorUserOperation } from "permissionless/actions/pimlico"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `pimlicoActions` | decorator factory | Returns decorator adding all Pimlico methods |
| `getTokenQuotes` | function | Get ERC-20 paymaster token quotes |
| `getUserOperationGasPrice` | function | Get gas price recommendations |
| `getUserOperationStatus` | function | Check UserOp status |
| `sendCompressedUserOperation` | function | Send compressed UserOp (deprecated) |
| `sponsorUserOperation` | function | Sponsor a UserOp via Pimlico |
| `validateSponsorshipPolicies` | function | Validate sponsorship policies |
| `PimlicoActions` | type | Actions object type |
| `GetTokenQuotesParameters` | type | Token quotes params |
| `GetTokenQuotesReturnType` | type | Token quotes return |
| `GetUserOperationGasPriceReturnType` | type | Gas price return |
| `GetUserOperationStatusParameters` | type | Status params |
| `GetUserOperationStatusReturnType` | type | Status return |
| `SendCompressedUserOperationParameters` | type | Compressed UserOp params |
| `PimlicoSponsorUserOperationParameters` | type | Sponsor params |
| `SponsorUserOperationReturnType` | type | Sponsor return |
| `ValidateSponsorshipPoliciesParameters` | type | Validation params |
| `ValidateSponsorshipPolicies` | type | Validation return |

---

## `permissionless/actions/smartAccount`

```typescript
import { sendTransaction, signMessage } from "permissionless/actions/smartAccount"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `sendTransaction` | function | Send transaction via UserOp |
| `signMessage` | function | EIP-191 message signing |
| `signTypedData` | function | EIP-712 typed data signing |
| `writeContract` | function | Contract write via UserOp |

---

## `permissionless/actions/etherspot`

```typescript
import { getUserOperationGasPrice } from "permissionless/actions/etherspot"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `getUserOperationGasPrice` | function | Get gas price from Etherspot bundler |
| `GetGasPriceResponseReturnType` | type | Gas price return type |

---

## `permissionless/actions/passkeyServer`

```typescript
import { startRegistration, verifyRegistration } from "permissionless/actions/passkeyServer"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `startRegistration` | function | Start WebAuthn registration |
| `verifyRegistration` | function | Verify WebAuthn registration |
| `getCredentials` | function | Get registered credentials |
| `StartRegistrationParameters` | type | Registration start params |
| `StartRegistrationReturnType` | type | Registration start return |
| `VerifyRegistrationParameters` | type | Verification params |
| `VerifyRegistrationReturnType` | type | Verification return |
| `GetCredentialsParameters` | type | Credentials query params |
| `GetCredentialsReturnType` | type | Credentials return |

---

## `permissionless/clients`

```typescript
import { createSmartAccountClient, smartAccountActions } from "permissionless/clients"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `createSmartAccountClient` | function | Create a bundler client with smart account support |
| `smartAccountActions` | decorator | Adds sendTransaction, signMessage, etc. |
| `SmartAccountClient` | type | Client return type |
| `SmartAccountClientConfig` | type | Client config type |
| `SmartAccountActions` | type | Decorator actions type |

---

## `permissionless/clients/pimlico`

```typescript
import { createPimlicoClient } from "permissionless/clients/pimlico"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `createPimlicoClient` | function | Create a Pimlico bundler/paymaster client |
| `PimlicoClient` | type | Client return type |
| `PimlicoClientConfig` | type | Client config type |
| `PimlicoActions` | type | Pimlico actions type |
| `pimlicoActions` | decorator factory | Pimlico actions decorator |

---

## `permissionless/clients/passkeyServer`

```typescript
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `createPasskeyServerClient` | function | Create a passkey server client |
| `PasskeyServerClient` | type | Client return type |
| `PasskeyServerClientConfig` | type | Client config type |

---

## `permissionless/utils`

```typescript
import { encodeNonce, decodeNonce, getRequiredPrefund } from "permissionless/utils"
```

Same as the utility exports from the root -- see the root section above for the full list.

---

## `permissionless/errors`

```typescript
import { AccountNotFoundError } from "permissionless/errors"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `AccountNotFoundError` | class | Thrown when no account is found on client or action |

---

## `permissionless/experimental/pimlico`

```typescript
import { prepareUserOperationForErc20Paymaster } from "permissionless/experimental/pimlico"
```

| Symbol | Kind | Description |
|--------|------|-------------|
| `prepareUserOperationForErc20Paymaster` | function | Factory returning a `prepareUserOperation` hook for ERC-20 paymaster |

---

## Conditional Export Format

Every subpath follows this pattern in `package.json`:

```json
"./subpath": {
    "types": "./_types/subpath/index.d.ts",
    "import": "./_esm/subpath/index.js",
    "default": "./_cjs/subpath/index.js"
}
```

- **`types`** -- TypeScript resolves `.d.ts` files from `_types/`
- **`import`** -- ESM environments (`import` statement, bundlers) use `_esm/`
- **`default`** -- CommonJS `require()` uses `_cjs/`
