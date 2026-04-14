# Smart Accounts

permissionless provides 12 smart account implementations, each created by an async factory function that returns a viem `SmartAccount`.

## Common Factory Pattern

Every account is created by a `to*SmartAccount()` function:

```typescript
import { toSimpleSmartAccount } from "permissionless/accounts"

const account = await toSimpleSmartAccount({
    client: publicClient,   // viem Client for on-chain reads
    owner,                  // key that controls the account
    // Optional parameters:
    entryPoint: { address, version: "0.7" },
    factoryAddress: "0x...",
    index: 0n,
    address: "0x...",
    nonceKey: 0n,
})
```

### Common Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client<Transport, Chain \| undefined>` | Yes | -- | viem client for on-chain reads (public client, wallet client, etc.) |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | The key that signs UserOperations |
| `entryPoint` | `{ address: Address, version: EntryPointVersion }` | No | `{ address: entryPoint07Address, version: "0.7" }` | EntryPoint contract to use |
| `factoryAddress` | `Address` | No | Account-specific default | Factory contract that deploys the account |
| `index` | `bigint` | No | `0n` | Salt for deterministic address computation |
| `address` | `Address` | No | Computed from factory | Override the counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key for 2D nonce system |

Note: Not all accounts support all parameters. EIP-7702 accounts do not accept `factoryAddress`, `index`, `address`, or `nonceKey`. Some accounts have additional provider-specific parameters.

### Common Return Interface

Every `SmartAccount` returned by a factory has these methods:

| Method | Returns | Description |
|--------|---------|-------------|
| `getAddress()` | `Address` | Counterfactual address (works pre-deployment) |
| `encodeCalls(calls)` | `Hex` | Encode calls into account-specific execution calldata |
| `decodeCalls(data)` | `{ to, value, data }[]` | Decode calldata back to individual calls |
| `getNonce()` | `bigint` | Read current nonce from EntryPoint |
| `getStubSignature()` | `Hex` | Dummy signature for gas estimation |
| `sign(hash)` | `Hex` | Sign a raw hash |
| `signMessage(message)` | `Hex` | EIP-191 message signature (ERC-1271) |
| `signTypedData(typedData)` | `Hex` | EIP-712 typed data signature (ERC-1271) |
| `signUserOperation(userOp)` | `Hex` | Sign a complete UserOperation |
| `getFactoryArgs()` | `{ factory, factoryData } \| undefined` | Factory data for first UserOp (undefined after deployment) |

## Account Summary

| Account | Factory Function | EntryPoint | ERC-7579 | EIP-7702 | ERC-1271 |
|---------|-----------------|------------|----------|----------|----------|
| [Simple](./simple-smart-account.md) | `toSimpleSmartAccount` | 0.6, 0.7, 0.8 | No | No | No |
| [Simple (7702)](./simple-smart-account-7702.md) | `to7702SimpleSmartAccount` | 0.8 | No | Yes | No |
| [Safe](./safe-smart-account.md) | `toSafeSmartAccount` | 0.6, 0.7 | Yes (0.7) | No | Yes |
| [Kernel](./kernel-smart-account.md) | `toKernelSmartAccount` | 0.6, 0.7 | Yes (v3+) | No | Yes |
| [ECDSA Kernel](./ecdsa-kernel-smart-account.md) | `toEcdsaKernelSmartAccount` | 0.6, 0.7 | Yes (v3+) | No | Yes |
| [Kernel (7702)](./kernel-smart-account-7702.md) | `to7702KernelSmartAccount` | 0.8 | Yes | Yes | Yes |
| [Light](./light-smart-account.md) | `toLightSmartAccount` | 0.6, 0.7 | No | No | Yes |
| [Biconomy](./biconomy-smart-account.md) | `toBiconomySmartAccount` | 0.7 | No | No | Yes |
| [Trust](./trust-smart-account.md) | `toTrustSmartAccount` | 0.7 | No | No | Yes |
| [Etherspot](./etherspot-smart-account.md) | `toEtherspotSmartAccount` | 0.7 | Yes | No | Yes |
| [Nexus](./nexus-smart-account.md) | `toNexusSmartAccount` | 0.7 | Yes | No | Yes |
| [Thirdweb](./thirdweb-smart-account.md) | `toThirdwebSmartAccount` | 0.7 | No | No | Yes |

## Import

All account factories are available from a single subpath:

```typescript
import {
    toSimpleSmartAccount,
    to7702SimpleSmartAccount,
    toSafeSmartAccount,
    toKernelSmartAccount,
    toEcdsaKernelSmartAccount,
    to7702KernelSmartAccount,
    toLightSmartAccount,
    toBiconomySmartAccount,
    toTrustSmartAccount,
    toEtherspotSmartAccount,
    toNexusSmartAccount,
    toThirdwebSmartAccount,
} from "permissionless/accounts"
```

## Types

Each account exports three types following a consistent naming pattern:

```typescript
import type {
    ToSimpleSmartAccountParameters,    // Factory input type
    ToSimpleSmartAccountReturnType,    // Factory output type
    SimpleSmartAccountImplementation,  // Implementation details type
} from "permissionless/accounts"
```

Some accounts export additional types:
- `SafeVersion` -- `"1.4.1" | "1.5.0"`
- `LightAccountVersion` -- `"1.1.0" | "2.0.0"`
- `KernelVersion` -- Kernel version identifier
