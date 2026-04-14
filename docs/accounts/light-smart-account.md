# LightSmartAccount

The Light Account is a gas-optimized smart account with ERC-1271 signature support and two version tracks.

## Import

```typescript
import { toLightSmartAccount } from "permissionless/accounts"
import type {
    ToLightSmartAccountParameters,
    ToLightSmartAccountReturnType,
    LightSmartAccountImplementation,
    LightAccountVersion,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toLightSmartAccount<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
>(
    parameters: ToLightSmartAccountParameters<entryPointVersion>
): Promise<ToLightSmartAccountReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `version` | `LightAccountVersion` | Yes | -- | `"1.1.0"` (EP 0.6) or `"2.0.0"` (EP 0.7) |
| `entryPoint` | `{ address: Address, version }` | No | `"0.7"` | EntryPoint to use |
| `factoryAddress` | `Address` | No | Version-specific | Factory contract |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |

## LightAccountVersion

| Version | EntryPoint | Factory Address |
|---------|------------|-----------------|
| `"1.1.0"` | 0.6 | `0x00004EC70002a32400f8ae005A26081065620D20` |
| `"2.0.0"` | 0.7 | `0x0000000000400CdFef5E2714E63d8040b700BC24` |

## Implementation Details

- **ERC-1271:** Full support for `signMessage` and `signTypedData` (via EIP-1271 wrapper)
- **ERC-7579:** Not supported
- **Signing:** Standard ECDSA signing

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toLightSmartAccount } from "permissionless/accounts"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const account = await toLightSmartAccount({
    client: publicClient,
    owner: privateKeyToAccount("0x..."),
    version: "2.0.0",
})
```
