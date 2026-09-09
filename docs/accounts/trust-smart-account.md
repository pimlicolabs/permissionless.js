# TrustSmartAccount

The Trust wallet smart account (Barz) uses a diamond-proxy architecture with a secp256k1 verification facet. It supports EntryPoint 0.6 only.

## Import

```typescript
import { TrustSmartAccount } from "permissionless"
import type { TrustSmartAccount } from "permissionless"
// TrustSmartAccount.Parameters, TrustSmartAccount.ReturnType, TrustSmartAccount.Implementation
```

## Factory Function

```typescript
async function TrustSmartAccount.from(
    parameters: TrustSmartAccount.Parameters
): Promise<TrustSmartAccount.ReturnType>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `"0.6" \| { address: Address, version: "0.6" }` | No | `"0.6"` | EntryPoint 0.6 is the only supported version |
| `factoryAddress` | `Address` | No | `0x729c310186a57833f622630a16d13f710b83272a` | Factory contract |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `secp256k1VerificationFacetAddress` | `Address` | No | `0x81b9E3689390C7e74cF526594A105Dea21a8cdD5` | Verification facet |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none (`getNonce({ key })` wins) |

## Supported EntryPoint Versions

- **0.6** only (default)

## Implementation Details

- **ERC-1271:** Yes (via EIP-712 `BarzMessage` signing)
- **Architecture:** Diamond proxy pattern with pluggable facets
- **User operation hashing:** permissionless's internal EntryPoint 0.6 packing path (viem 3 packs 0.7+ only)

## Errors

- `EmptyCallsError` -- `encodeCalls([])`
- `TrustInvalidCallDataError` -- `decodeCalls` on data that is neither `execute` nor `executeBatch`

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { TrustSmartAccount } from "permissionless"

const account = await TrustSmartAccount.from({
    client: Client.create({ chain: sepolia, transport: http() }),
    owner: Account.fromPrivateKey("0x...")
})
```

## Migrating from 0.x

- `toTrustSmartAccount` -> `TrustSmartAccount.from`, imported from `permissionless` (the `permissionless/accounts` subpath is gone).
- `entryPoint` is optional; omitting it derives the same address as the explicit 0.6 form did in 0.x.
- `ToTrustSmartAccountParameters` / `ToTrustSmartAccountReturnType` / `TrustSmartAccountImplementation` -> `TrustSmartAccount.Parameters` / `.ReturnType` / `.Implementation`.
- When neither the call nor the constructor supplies a nonce key, the key is `0n` (0.x fell through to viem's timestamp-derived key). Pass `getNonce({ key })` or `nonceKey` for parallel nonces.
