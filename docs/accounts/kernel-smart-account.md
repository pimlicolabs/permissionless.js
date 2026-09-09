# KernelSmartAccount

The Kernel smart account is a modular ERC-7579-compatible account supporting ECDSA and WebAuthn owners. It has versions for both EntryPoint 0.6 (v0.2.x) and 0.7 (v0.3.x).

## Import

```typescript
import { KernelSmartAccount } from "permissionless"
```

The namespace exports `from`, `getVersion`, `wrapMessageHash`, `signMessage`, `signTypedData` and the types `Parameters`, `ReturnType`, `Implementation`, `Version`.

## `KernelSmartAccount.from`

```typescript
async function from<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    eip7702 extends boolean = false
>(
    parameters: KernelSmartAccount.Parameters<entryPointVersion, eip7702>
): Promise<KernelSmartAccount.ReturnType<entryPointVersion, eip7702>>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider \| WebAuthnAccount` | Yes | -- | Account that controls the Kernel |
| `entryPoint` | `"0.6" \| "0.7" \| { address, version }` | No | `"0.7"` | EntryPoint to use |
| `version` | `KernelSmartAccount.Version` | No | `"0.3.0-beta"` on 0.7, `"0.2.2"` on 0.6, `"0.3.3"` with `eip7702` | Kernel version |
| `eip7702` | `boolean` | No | `false` | Use the owner EOA as the account, delegated to the Kernel implementation |
| `factoryAddress` | `Address` | No | Version-specific | Factory contract |
| `metaFactoryAddress` | `Address` | No | Version-specific | Meta-factory for delegated deploys (v0.3.x) |
| `accountLogicAddress` | `Address` | No | Version-specific | Account implementation |
| `validatorAddress` | `Address` | No | Version-specific | Root validator; ECDSA by default, WebAuthn for WebAuthn owners |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none |
| `useMetaFactory` | `boolean \| "optional"` | No | `true` | Deploy through the meta-factory (v0.3.x); `"optional"` falls back to the factory |

The defaults are frozen for the 1.x line: omitting `entryPoint` or `version` derives the same counterfactual address as pinning them.

### Version

| EntryPoint | Available Versions |
|------------|-------------------|
| 0.6 | `"0.2.1"`, `"0.2.2"`, `"0.2.3"`, `"0.2.4"` |
| 0.7 | `"0.3.0-beta"`, `"0.3.1"`, `"0.3.2"`, `"0.3.3"` |

A version the EntryPoint does not support throws `KernelUnsupportedVersionError`.

### Nonce keys

`account.getNonce({ key })` resolves the key as the per-call `key`, then the constructor `nonceKey`, then `0n`. Kernel v0.3.x packs the key into the 2-byte user-key field of its nonce layout and throws `KernelNonceKeyTooLargeError` above `maxUint16`; v0.2.x passes it to the EntryPoint unchanged.

## `KernelSmartAccount.getVersion`

```typescript
async function getVersion(
    client: Client,
    parameters: { address: Address }
): Promise<KernelSmartAccount.Version | null>
```

Reads the deployed Kernel version from the account's `eip712Domain()`. Returns `null` when the address has no code and throws `InvalidKernelAccountError` when the contract is not a Kernel. Use it to construct an account for an already-deployed Kernel whose version differs from your default.

## Implementation Details

- **Signing:** Validator-prepended signatures for ERC-1271 compliance
- **ERC-7579:** Full support in v0.3.x (validators, executors, fallbacks, hooks)
- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **WebAuthn:** Supported via WebAuthnAccount owner type
- **EIP-7702:** `eip7702: true` uses Kernel 0.3.3 as the delegate; you sign and pass the authorization yourself. Signatures made before delegation verify once the EOA is delegated.

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { KernelSmartAccount } from "permissionless"

const publicClient = Client.create({
    chain: sepolia,
    transport: http(),
})

const owner = Account.fromPrivateKey("0x...")

const account = await KernelSmartAccount.from({
    client: publicClient,
    owner,
    version: "0.3.1",
})
```

### Matching a deployed account

```typescript
const version = await KernelSmartAccount.getVersion(publicClient, {
    address: "0x...",
})

const account = await KernelSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: "0.7",
    version: version ?? "0.3.1",
})
```

### EIP-7702

```typescript
const account = await KernelSmartAccount.from({
    client: publicClient,
    owner,
    eip7702: true,
})
```
