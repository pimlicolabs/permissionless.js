# TrustSmartAccount

The Trust wallet smart account uses a diamond-proxy architecture with a secp256k1 verification facet.

## Import

```typescript
import { toTrustSmartAccount } from "permissionless/accounts"
import type {
    ToTrustSmartAccountParameters,
    ToTrustSmartAccountReturnType,
    TrustSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toTrustSmartAccount(
    parameters: ToTrustSmartAccountParameters
): Promise<ToTrustSmartAccountReturnType>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `{ address: Address, version: "0.6" }` | Yes | -- | Must be EntryPoint 0.6 |
| `factoryAddress` | `Address` | No | `0x729c310186a57833f622630a16d13f710b83272a` | Factory contract |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `secp256k1VerificationFacetAddress` | `Address` | No | `0x81b9E3689390C7e74cF526594A105Dea21a8cdD5` | Verification facet |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |

## Supported EntryPoint Versions

- **0.6** only (required)

## Implementation Details

- **ERC-1271:** Yes (via EIP-712 signing)
- **Architecture:** Diamond proxy pattern with pluggable facets

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toTrustSmartAccount } from "permissionless/accounts"

const account = await toTrustSmartAccount({
    client: createPublicClient({ chain: sepolia, transport: http() }),
    owner: privateKeyToAccount("0x..."),
    entryPoint: {
        address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        version: "0.6",
    },
})
```
