# ThirdwebSmartAccount

The Thirdweb smart account supports both EntryPoint 0.6 and 0.7 with salt-based account derivation.

## Import

```typescript
import { toThirdwebSmartAccount } from "permissionless/accounts"
import type {
    ToThirdwebSmartAccountParameters,
    ToThirdwebSmartAccountReturnType,
    ThirdwebSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toThirdwebSmartAccount<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
>(
    parameters: ToThirdwebSmartAccountParameters<entryPointVersion>
): Promise<ToThirdwebSmartAccountReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `{ address: Address, version }` | No | `"0.7"` | EntryPoint to use |
| `version` | `"1.5.20"` | No | `"1.5.20"` | Account version |
| `factoryAddress` | `Address` | No | Version-specific | Factory contract |
| `salt` | `string` | No | -- | String salt for account derivation |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |

### Default Factory Addresses

| EntryPoint | Factory Address |
|------------|----------------|
| 0.6 | `0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00` |
| 0.7 | `0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb` |

## Supported EntryPoint Versions

- **0.6** -- Legacy support
- **0.7** -- Default

## Implementation Details

- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **ERC-7579:** Not supported
- **Salt:** Uses string-based salt (hashed with keccak256) for address derivation

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toThirdwebSmartAccount } from "permissionless/accounts"

const account = await toThirdwebSmartAccount({
    client: createPublicClient({ chain: sepolia, transport: http() }),
    owner: privateKeyToAccount("0x..."),
})
```
