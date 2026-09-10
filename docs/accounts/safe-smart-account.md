# SafeSmartAccount

The Safe smart account is a multi-owner Safe running the Safe 4337 module, with an optional WebAuthn (passkey) owner and ERC-7579 modules through the Safe7579 launchpad. Safe 1.4.1 runs on EntryPoint 0.6 and 0.7, Safe 1.5.0 on EntryPoint 0.7.

## Import

```typescript
import { SafeSmartAccount } from "permissionless"
import type { SafeSmartAccount } from "permissionless"
// SafeSmartAccount.Parameters, SafeSmartAccount.ReturnType, SafeSmartAccount.Implementation,
// SafeSmartAccount.Version, SafeSmartAccount.SignUserOperationParameters
```

The namespace exports `from`, `signUserOperation` and the types above.

## Constructor

```typescript
async function SafeSmartAccount.from<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    erc7579 extends Address | undefined = undefined
>(
    parameters: SafeSmartAccount.Parameters<entryPointVersion, erc7579>
): Promise<SafeSmartAccount.ReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owners` | `(Account.Account \| WalletClient \| EthereumProvider \| WebAuthnAccount)[]` | Yes | -- | Owner set, at most one WebAuthn owner. An address-only `Account.Account` counts as an owner but cannot sign locally |
| `threshold` | `bigint` | No | `BigInt(owners.length)` | Signatures required per UserOperation |
| `version` | `SafeSmartAccount.Version` | No | `"1.4.1"` | Safe version |
| `entryPoint` | `"0.6" \| "0.7" \| { address, version }` | No | `"0.7"` | EntryPoint to use |
| `address` | `Address` | No | Computed | Address of an already deployed Safe; skips the counterfactual derivation |
| `saltNonce` | `bigint` | No | `0n` | Salt passed to the proxy factory |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none (`getNonce({ key })` wins) |
| `validAfter` | `number` | No | `0` | Signature validity start (unix seconds) |
| `validUntil` | `number` | No | `0` | Signature validity end (`0` = none) |
| `safe4337ModuleAddress` | `Address` | No | Per version and EntryPoint | Safe 4337 module |
| `safeProxyFactoryAddress` | `Address` | No | Per version and EntryPoint | Proxy factory |
| `safeSingletonAddress` | `Address` | No | Per version and EntryPoint | Safe singleton |
| `safeWebAuthnSharedSignerAddress` | `Address` | No | Per version, EntryPoint 0.7 only | Shared signer for the WebAuthn owner |
| `safeP256VerifierAddress` | `Address` | No | Per version, EntryPoint 0.7 only | P-256 verifier for the WebAuthn owner |
| `paymentToken` | `Address` | No | `Address.zero` | Setup payment token |
| `payment` | `bigint` | No | `0n` | Setup payment amount |
| `paymentReceiver` | `Address` | No | `Address.zero` | Setup payment receiver |
| `onchainIdentifier` | `Hex` | No | -- | Bytes appended to every `encodeCalls` result |
| `useMultiSendForSetup` | `boolean` | No | `true` | Route the setup through MultiSend even when it is a single call |
| `erc7579LaunchpadAddress` | `Address` | No | -- | Safe7579 launchpad; switches the account into ERC-7579 mode |

Without `erc7579LaunchpadAddress`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `safeModuleSetupAddress` | `Address` | Per version and EntryPoint | Module setup contract |
| `multiSendAddress` | `Address` | Per version and EntryPoint | MultiSend |
| `multiSendCallOnlyAddress` | `Address` | Per version and EntryPoint | MultiSendCallOnly (batch execution) |
| `safeModules` | `Address[]` | `[]` | Extra Safe modules enabled at setup |

With `erc7579LaunchpadAddress`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `validators` | `{ address, context }[]` | `[]` | Validator modules installed at setup |
| `executors` | `{ address, context }[]` | `[]` | Executor modules |
| `fallbacks` | `{ address, context }[]` | `[]` | Fallback modules |
| `hooks` | `{ address, context }[]` | `[]` | Hook modules |
| `attesters` | `Address[]` | `[]` | Registry attesters, sorted byte-wise before encoding |
| `attestersThreshold` | `number` | `0` | Attester threshold |

Defaults are frozen for the 1.x line: omitting `entryPoint` or `version` derives the same address as passing `"0.7"` / `"1.4.1"` explicitly.

### Version

| Safe | EntryPoint |
|------|------------|
| `"1.4.1"` | 0.6, 0.7 |
| `"1.5.0"` | 0.7 |

Safe 1.5.0 on EntryPoint 0.6 throws `SafeEntryPointVersionUnsupportedError`. Module, factory, singleton, MultiSend, shared-signer and verifier addresses default per pair (`SAFE_VERSION_TO_ADDRESSES_MAP` in `accounts/safe/from.ts`).

### Nonce keys

`account.getNonce({ key })` resolves the key as the per-call `key`, then the constructor `nonceKey`, then `0n`. The key is passed to the EntryPoint unchanged.

## `SafeSmartAccount.signUserOperation`

```typescript
async function SafeSmartAccount.signUserOperation(
    parameters: SafeSmartAccount.SignUserOperationParameters
): Promise<Hex>
```

Signs a UserOperation as one owner and accumulates the result, for Safes whose owners sign on different machines. `account.signUserOperation` calls it once per local owner; call it directly when `threshold` exceeds the owners that can sign locally.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `...userOperation` | `UserOperation<"0.7">` fields, plus 0.6 `initCode` / `paymasterAndData` | Yes | -- | The UserOperation; `sender` is required |
| `account` | `Account.Local \| WalletClient \| EthereumProvider \| WebAuthnAccount` | Yes | -- | The owner signing now |
| `owners` | `(Account.Account \| WebAuthnAccount)[]` | Yes | -- | The owners that will sign |
| `chainId` | `number` | Yes | -- | Chain id |
| `signatures` | `Hex` | No | -- | Return value of the previous owner's call |
| `version` | `SafeSmartAccount.Version` | No | `"1.4.1"` | Safe version |
| `entryPoint` | `"0.6" \| "0.7" \| { address, version }` | No | `"0.7"` | EntryPoint |
| `validAfter`, `validUntil` | `number` | No | `0` | Validity window |
| `safe4337ModuleAddress`, `safeWebAuthnSharedSignerAddress` | `Address` | No | Per version and EntryPoint | Overrides |

Until every entry of `owners` has signed, the return value is the ABI-encoded partial signature set to pass back as `signatures`. Once the count matches, it is the packed Safe signature (`validAfter`, `validUntil`, then the owner signatures sorted by owner address) for `userOperation.signature`.

```typescript
let signatures: Hex | undefined
for (const owner of owners) {
    signatures = await SafeSmartAccount.signUserOperation({
        ...userOperation,
        sender: account.address,
        chainId,
        owners,
        account: owner,
        signatures
    })
}
```

## Implementation Details

- **Multi-owner:** `signUserOperation` collects one signature per local owner (the WebAuthn owner signs through the shared signer) and sorts them by owner address. Fewer local owners than `threshold` throws `SafeInsufficientOwnersError`.
- **Verification gas:** for a deployed Safe with `threshold > 1`, the account's `userOperation.estimateGas` hook floors `verificationGasLimit` at `80_000 + 15_000 × threshold` (plus `50_000` in ERC-7579 mode, plus `400_000` with a WebAuthn owner). Bundlers estimate against the stub signature, which only pays for the first owner's check.
- **UserOperation signing:** owners sign the 4337 module's `SafeOp` EIP-712 struct, not the EntryPoint hash.
- **ERC-1271:** `signMessage`, `signTypedData` and `sign({ hash })` wrap the digest in the Safe's `SafeMessage` EIP-712 struct and have every local owner sign it; the result verifies on-chain, and through ERC-6492 before deployment. In ERC-7579 mode on Safe 1.5.0 they throw `SafeErc7579VersionUnsupportedError`, and an undeployed ERC-7579 Safe cannot be verified until its first UserOperation (the launchpad proxy has no `isValidSignature` yet).
- **WebAuthn:** one WebAuthn owner per Safe, through the shared signer (EntryPoint 0.7, where the shared signer and P-256 verifier have defaults).
- **ERC-7579:** with `erc7579LaunchpadAddress`, calls are encoded with `Erc7579.encodeCalls`; the first UserOperation of an undeployed Safe wraps them in the launchpad's `setupSafe`.
- **Batch execution:** without ERC-7579, several calls go through MultiSendCallOnly as a delegatecall.

## Errors

- `EmptyCallsError` -- `encodeCalls([])`
- `SafeEntryPointVersionUnsupportedError` -- Safe 1.5.0 with EntryPoint 0.6
- `SafeInvalidOwnerError` -- an owner that is not an account, wallet client, EIP-1193 provider or WebAuthn account
- `SafeInsufficientOwnersError` -- signing with fewer local owners than `threshold`
- `SafeErc7579VersionUnsupportedError` -- `sign`, `signMessage`, `signTypedData` in ERC-7579 mode on Safe 1.5.0
- `SafeWebAuthnSharedSignerAddressMissingError` -- a WebAuthn owner without a shared signer address (EntryPoint 0.6)
- `SafeSenderRequiredError` -- `SafeSmartAccount.signUserOperation` without `sender`
- `SafeInvalidWebAuthnClientDataError` -- a WebAuthn response whose `clientDataJSON` lacks the challenge
- `SafeInvalidSignatureError` -- an owner signature with an unexpected `v`

## Example

### Single owner

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { SafeSmartAccount } from "permissionless"

const publicClient = Client.create({ chain: sepolia, transport: http() })
const owner = Account.fromPrivateKey("0x...")

const account = await SafeSmartAccount.from({
    client: publicClient,
    owners: [owner]
})
```

### Safe 1.5.0

```typescript
const account = await SafeSmartAccount.from({
    client: publicClient,
    owners: [owner],
    version: "1.5.0"
})
```

### 2-of-3

```typescript
const account = await SafeSmartAccount.from({
    client: publicClient,
    owners: [owner1, owner2, owner3],
    threshold: 2n
})
```

### ERC-7579

```typescript
const account = await SafeSmartAccount.from({
    client: publicClient,
    owners: [owner],
    safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
    erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
    attesters: ["0x000000333034E9f539ce08819E12c1b8Cb29084d"],
    attestersThreshold: 1
})
```

### An already deployed Safe

```typescript
const account = await SafeSmartAccount.from({
    client: publicClient,
    owners: [owner],
    address: "0x..."
})
```

## Migrating from 0.x

- The 0.x factory function -> `SafeSmartAccount.from`, imported from `permissionless` (the `accounts` and `accounts/safe` subpaths are gone). `SafeSmartAccount.signUserOperation` lives on the same namespace.
- `ToSafeSmartAccountParameters` / `ToSafeSmartAccountReturnType` / `SafeSmartAccountImplementation` / `SafeVersion` -> `SafeSmartAccount.Parameters` / `.ReturnType` / `.Implementation` / `.Version`.
- `version` is optional (default `"1.4.1"`); `entryPoint` takes the `"0.7"` shorthand and is optional. Omitting either derives the address the explicit 0.x form did.
- `setupTransactions` is removed. A Safe that 0.x deployed with it has a different address than the 1.0 derivation for the same owners and salt; pass `address` to keep operating it.
- `addModuleLibAddress` -> `safeModuleSetupAddress`.
- When neither the call nor the constructor supplies a nonce key, the key is `0n` (0.x fell through to viem's timestamp-derived key). Pass `getNonce({ key })` or `nonceKey` for parallel nonces.
