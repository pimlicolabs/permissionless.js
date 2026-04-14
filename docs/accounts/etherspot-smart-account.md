# EtherspotSmartAccount

The Etherspot smart account is a modular account with ERC-7579 support, using ECDSA validation by default.

## Import

```typescript
import { toEtherspotSmartAccount } from "permissionless/accounts"
import type {
    ToEtherspotSmartAccountParameters,
    ToEtherspotSmartAccountReturnType,
    EtherspotSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toEtherspotSmartAccount<
    entryPointVersion extends "0.6" | "0.7"
>(
    parameters: ToEtherspotSmartAccountParameters<entryPointVersion>
): Promise<ToEtherspotSmartAccountReturnType>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owners` | `[LocalAccount \| WalletClient \| EthereumProvider]` | Yes | -- | Single owner in array format |
| `entryPoint` | `{ address: Address, version }` | No | `"0.7"` | EntryPoint to use |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `metaFactoryAddress` | `Address` | No | Default | Meta-factory for deployment |
| `validatorAddress` | `Address` | No | Default ECDSA | Validator module |
| `bootstrapAddress` | `Address` | No | Default | Bootstrap contract |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |

## Implementation Details

- **ERC-7579:** Full support (validators, executors, modular execution modes)
- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **Execution modes:** Supports `call` and `batchcall` via ERC-7579 encoding

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toEtherspotSmartAccount } from "permissionless/accounts"

const account = await toEtherspotSmartAccount({
    client: createPublicClient({ chain: sepolia, transport: http() }),
    owners: [privateKeyToAccount("0x...")],
})
```
