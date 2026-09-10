# Smart Accounts

permissionless provides eight smart account implementations. Each is a namespace exported from the package root whose async `from` function returns a viem `SmartAccount`.

## Common Pattern

Every account is created by `<X>SmartAccount.from()`:

```typescript
import { SimpleSmartAccount } from "permissionless"

const account = await SimpleSmartAccount.from({
    client: publicClient,   // viem Client for on-chain reads
    owner,                  // key that controls the account
    // Optional parameters:
    entryPoint: "0.8",      // shorthand, or { address, version }
    factoryAddress: "0x...",
    index: 0n,
    address: "0x...",
    nonceKey: 0n,
})
```

### Common Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads (public client, wallet client, etc.) |
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | -- | The key that signs UserOperations |
| `entryPoint` | `EntryPoint.Version \| { address, version }` | No | Account-specific (see table) | EntryPoint to use; the version shorthand resolves to the canonical address |
| `factoryAddress` | `Address` | No | Account-specific default | Factory contract that deploys the account |
| `index` | `bigint` | No | `0n` | Salt for deterministic address computation |
| `address` | `Address` | No | Computed from factory | Override the counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key for the 2D nonce; a per-call `key` takes precedence |

Note: Not all accounts support all parameters. In EIP-7702 mode (`eip7702: true`) the account address is the owner EOA, so `factoryAddress`, `index` and `address` do not apply. Some accounts have additional provider-specific parameters.

### Common Return Interface

Every `SmartAccount` returned by `from` has these methods:

| Method | Returns | Description |
|--------|---------|-------------|
| `address` | `Address` | Counterfactual address (known pre-deployment) |
| `encodeCalls(calls)` | `Hex` | Encode calls into account-specific execution calldata |
| `decodeCalls(data)` | `{ to, value, data }[]` | Decode calldata back to individual calls |
| `getNonce({ key? })` | `bigint` | Read the current nonce from the EntryPoint |
| `getStubSignature()` | `Hex` | Dummy signature for gas estimation |
| `sign({ hash })` | `Hex` | Sign a raw hash |
| `signMessage(message)` | `Hex` | EIP-191 message signature (ERC-1271) |
| `signTypedData(typedData)` | `Hex` | EIP-712 typed data signature (ERC-1271) |
| `signUserOperation(userOp)` | `Hex` | Sign a complete UserOperation |
| `getFactoryArgs()` | `{ factory, factoryData }` | Factory data for the first UserOp (both `undefined` after deployment) |
| `isDeployed()` | `boolean` | Whether the account has code |

## Account Summary

| Account | Constructor | EntryPoint | Default EP | ERC-7579 | EIP-7702 | ERC-1271 |
|---------|-------------|------------|------------|----------|----------|----------|
| [Simple](./simple-smart-account.md) | `SimpleSmartAccount.from` | 0.6, 0.7, 0.8, 0.9 | 0.8 | No | No | No |
| [Simple (7702)](./simple-smart-account-7702.md) | `SimpleSmartAccount.from` with `eip7702: true` | 0.8, 0.9 | 0.8 | No | Yes | No |
| [Safe](./safe-smart-account.md) | `SafeSmartAccount.from` | 0.6, 0.7 | 0.7 | Yes (with `erc7579LaunchpadAddress`) | No | Yes |
| [Kernel](./kernel-smart-account.md) | `KernelSmartAccount.from` | 0.6, 0.7 | 0.7 | Yes (v0.3.x) | Yes (`eip7702: true`, Kernel 0.3.3 on 0.7) | Yes |
| [Light](./light-smart-account.md) | `LightSmartAccount.from` | 0.6, 0.7 | 0.7 | No | No | Yes |
| [Trust](./trust-smart-account.md) | `TrustSmartAccount.from` | 0.6 | 0.6 | No | No | Yes |
| [Etherspot](./etherspot-smart-account.md) | `EtherspotSmartAccount.from` | 0.7 | 0.7 | Yes | No | Yes |
| [Nexus](./nexus-smart-account.md) | `NexusSmartAccount.from` | 0.7 | 0.7 | Yes | No | Yes |
| [Thirdweb](./thirdweb-smart-account.md) | `ThirdwebSmartAccount.from` | 0.6, 0.7 | 0.7 | No | No | Yes |

## Import

All account namespaces are exported from the package root; the 0.x `permissionless/accounts` subpath is gone (see the [export map](../architecture/02-export-map.md)):

```typescript
import {
    EtherspotSmartAccount,
    KernelSmartAccount,
    LightSmartAccount,
    NexusSmartAccount,
    SafeSmartAccount,
    SimpleSmartAccount,
    ThirdwebSmartAccount,
    TrustSmartAccount,
} from "permissionless"
```

## Types

Each namespace exports `Parameters`, `ReturnType` and `Implementation`:

```typescript
import type { SafeSmartAccount } from "permissionless"

type Parameters = SafeSmartAccount.Parameters
type ReturnType = SafeSmartAccount.ReturnType
type Implementation = SafeSmartAccount.Implementation
```

Versioned accounts also export `Version`:

- `SafeSmartAccount.Version` -- `"1.4.1" | "1.5.0"`
- `KernelSmartAccount.Version` -- `"0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"` on EntryPoint 0.6, `"0.3.0-beta" | "0.3.1" | "0.3.2" | "0.3.3"` on 0.7
- `LightSmartAccount.Version` -- `"1.1.0"` on EntryPoint 0.6, `"2.0.0"` on 0.7
- `NexusSmartAccount.Version` -- `"1.0.0"`
- `ThirdwebSmartAccount.Version` -- `"1.5.20"`

Namespace extras: `SafeSmartAccount.signUserOperation` (and `SignUserOperationParameters`); `KernelSmartAccount.getVersion`, `wrapMessageHash`, `signMessage`, `signTypedData`.
