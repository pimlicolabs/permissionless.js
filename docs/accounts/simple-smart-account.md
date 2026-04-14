# SimpleSmartAccount

The Simple smart account is a basic ERC-4337 account with single-owner ECDSA validation. It supports all three EntryPoint versions (0.6, 0.7, 0.8).

## Import

```typescript
import { toSimpleSmartAccount } from "permissionless/accounts"
import type {
    ToSimpleSmartAccountParameters,
    ToSimpleSmartAccountReturnType,
    SimpleSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toSimpleSmartAccount<
    entryPointVersion extends EntryPointVersion,
    owner extends OneOf<EthereumProvider | WalletClient | LocalAccount>,
    eip7702 extends boolean = false
>(
    parameters: ToSimpleSmartAccountParameters<entryPointVersion, owner, eip7702>
): Promise<ToSimpleSmartAccountReturnType<entryPointVersion, eip7702>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client<Transport, Chain \| undefined>` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `{ address: Address, version: EntryPointVersion }` | No | `{ version: "0.7" }` | EntryPoint to use |
| `factoryAddress` | `Address` | No | Version-specific (see below) | Factory contract address |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |
| `accountLogicAddress` | `Address` | No | `0xe6Cae83...` | Account implementation contract |
| `eip7702` | `boolean` | No | `false` | Enable EIP-7702 mode (see [EIP-7702 doc](../concepts/04-eip-7702.md)) |

### Default Factory Addresses

| EntryPoint | Factory Address |
|------------|----------------|
| 0.6 | `0x9406Cc6185a346906296840746125a0E44976454` |
| 0.7 | `0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985` |
| 0.8 | `0x13E9ed32155810FDbd067D4522C492D6f68E5944` |

## Supported EntryPoint Versions

- **0.6** -- Legacy support
- **0.7** -- Default
- **0.8** -- Latest (with EIP-7702 support)

## Implementation Details

- **Signing:** Hash-based for 0.6/0.7, EIP-712 typed data for 0.8
- **ERC-1271:** Not supported. `signMessage()` and `signTypedData()` throw errors.
- **ERC-7579:** Not supported
- **Batch execution ABI:**
  - 0.6: `executeBatch(address[] dest, bytes[] func)`
  - 0.7: `executeBatch(address[] dest, uint256[] value, bytes[] func)`
  - 0.8: `executeBatch((address target, uint256 value, bytes data)[] calls)`

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toSimpleSmartAccount } from "permissionless/accounts"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const owner = privateKeyToAccount("0x...")

const account = await toSimpleSmartAccount({
    client: publicClient,
    owner,
})

console.log("Address:", account.address)
```

### With EntryPoint 0.8

```typescript
import { entryPoint08Address } from "viem/account-abstraction"

const account = await toSimpleSmartAccount({
    client: publicClient,
    owner,
    entryPoint: {
        address: entryPoint08Address,
        version: "0.8",
    },
})
```
