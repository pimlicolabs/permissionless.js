# SimpleSmartAccount (EIP-7702)

The EIP-7702 variant of the Simple smart account enables EOA delegation -- your existing EOA address gains smart account capabilities without deploying a new contract.

## Import

```typescript
import { to7702SimpleSmartAccount } from "permissionless/accounts"
import type {
    To7702SimpleSmartAccountParameters,
    To7702SimpleSmartAccountReturnType,
    To7702SimpleSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function to7702SimpleSmartAccount<
    entryPointVersion extends "0.8",
    owner extends OneOf<EthereumProvider | WalletClient | LocalAccount>
>(
    parameters: To7702SimpleSmartAccountParameters<entryPointVersion, owner>
): Promise<To7702SimpleSmartAccountReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client<Transport, Chain \| undefined>` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | EOA to delegate |
| `entryPoint` | `{ address: Address, version: "0.8" }` | No | EntryPoint 0.8 | Must be version 0.8 |
| `accountLogicAddress` | `Address` | No | Default | Smart account logic contract |

Note: `factoryAddress`, `index`, `address`, and `nonceKey` are **not available** -- typed as `never`.

## Supported EntryPoint Versions

- **0.8** only (required for EIP-7702)

## Implementation Details

This is a thin wrapper around `toSimpleSmartAccount` with `eip7702: true`:
- The account address is the owner's EOA address
- No factory deployment occurs
- The UserOperation includes an `authorization` field
- Uses EIP-712 typed data signing

See [EIP-7702 Delegation](../concepts/04-eip-7702.md) for a detailed explanation.

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { entryPoint08Address } from "viem/account-abstraction"
import { to7702SimpleSmartAccount } from "permissionless/accounts"
import { createSmartAccountClient } from "permissionless"

const owner = privateKeyToAccount("0x...")

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const account = await to7702SimpleSmartAccount({
    client: publicClient,
    owner,
    entryPoint: {
        address: entryPoint08Address,
        version: "0.8",
    },
})

// Account address is the same as the owner's EOA address
console.log(account.address === owner.address) // true

const client = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com"),
})
```
