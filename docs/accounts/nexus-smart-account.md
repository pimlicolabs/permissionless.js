# NexusSmartAccount

The Nexus smart account is a modular ERC-7579 account with attestation support, designed as the successor to the Biconomy account.

## Import

```typescript
import { toNexusSmartAccount } from "permissionless/accounts"
import type {
    ToNexusSmartAccountParameters,
    ToNexusSmartAccountReturnType,
    NexusSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toNexusSmartAccount(
    parameters: ToNexusSmartAccountParameters
): Promise<ToNexusSmartAccountReturnType>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owners` | `[LocalAccount \| WalletClient \| EthereumProvider]` | Yes | -- | Single owner in array format |
| `version` | `"1.0.0"` | Yes | -- | Account version |
| `entryPoint` | `{ address: Address, version: "0.7" }` | No | EP 0.7 | EntryPoint to use |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `factoryAddress` | `Address` | No | `0x00000bb19a3579F4D779215dEf97AFbd0e30DB55` | K1 validator factory |
| `validatorAddress` | `Address` | No | `0x00000004171351c442B202678c48D8AB5B321E8f` | K1 validator |
| `attesters` | `Address[]` | No | -- | Trusted attesters for module deployment |
| `threshold` | `number` | No | -- | Attestation threshold |

## Supported EntryPoint Versions

- **0.7** only

## Implementation Details

- **ERC-7579:** Full support (uses `encode7579Calls` for execution encoding)
- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **Attestation:** Supports specifying trusted attesters and threshold for module validation

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toNexusSmartAccount } from "permissionless/accounts"

const account = await toNexusSmartAccount({
    client: createPublicClient({ chain: sepolia, transport: http() }),
    owners: [privateKeyToAccount("0x...")],
    version: "1.0.0",
})
```

### With Attesters

```typescript
const account = await toNexusSmartAccount({
    client: publicClient,
    owners: [owner],
    version: "1.0.0",
    attesters: ["0xAttester1...", "0xAttester2..."],
    threshold: 1,
})
```
