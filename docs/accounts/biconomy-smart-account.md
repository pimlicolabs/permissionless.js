# BiconomySmartAccount

> **Deprecated:** For new integrations, use [NexusSmartAccount](./nexus-smart-account.md) instead.

The Biconomy smart account uses an ECDSA validation module and supports EntryPoint 0.6.

## Import

```typescript
import { toBiconomySmartAccount } from "permissionless/accounts"
import type {
    ToBiconomySmartAccountParameters,
    ToBiconomySmartAccountReturnType,
    BiconomySmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toBiconomySmartAccount(
    parameters: ToBiconomySmartAccountParameters
): Promise<ToBiconomySmartAccountReturnType>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owners` | `[LocalAccount \| WalletClient \| EthereumProvider]` | Yes | -- | Single owner in array format |
| `entryPoint` | `{ address: Address, version: "0.6" }` | Yes | -- | Must be EntryPoint 0.6 |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |
| `factoryAddress` | `Address` | No | `0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5` | Factory contract |
| `ecdsaModuleAddress` | `Address` | No | `0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e` | ECDSA module |
| `accountLogicAddress` | `Address` | No | `0x0000002512019Dafb59528B82CB92D3c5D2423aC` | Account logic |
| `fallbackHandlerAddress` | `Address` | No | Default | Fallback handler |

## Supported EntryPoint Versions

- **0.6** only (required)

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toBiconomySmartAccount } from "permissionless/accounts"

const account = await toBiconomySmartAccount({
    client: createPublicClient({ chain: sepolia, transport: http() }),
    owners: [privateKeyToAccount("0x...")],
    entryPoint: {
        address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        version: "0.6",
    },
})
```
