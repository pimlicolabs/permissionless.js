# KernelSmartAccount (EIP-7702)

The EIP-7702 variant of the Kernel smart account enables EOA delegation with Kernel's modular architecture.

## Import

```typescript
import { to7702KernelSmartAccount } from "permissionless/accounts"
import type {
    To7702KernelSmartAccountParameters,
    To7702KernelSmartAccountReturnType,
    To7702KernelSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function to7702KernelSmartAccount<
    entryPointVersion extends "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<EthereumProvider | WalletClient | LocalAccount>
>(
    parameters: To7702KernelSmartAccountParameters<entryPointVersion, kernelVersion, owner>
): Promise<To7702KernelSmartAccountReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `LocalAccount \| WalletClient \| EthereumProvider` | Yes | -- | EOA to delegate |
| `version` | `KernelVersion` | No | Default | Kernel version |
| `entryPoint` | `{ address: Address, version: "0.7" }` | No | EP 0.7 | EntryPoint (0.7 only) |
| `accountLogicAddress` | `Address` | No | Default | Account implementation |

Note: `factoryAddress`, `index`, `address`, `nonceKey`, `metaFactoryAddress`, `validatorAddress`, `useMetaFactory` are **not available** for EIP-7702 accounts.

## Implementation Details

This is a thin wrapper around `toKernelSmartAccount` with `eip7702: true`. The account address is the owner's EOA address. No factory deployment occurs.

See [EIP-7702 Delegation](../concepts/04-eip-7702.md) for background.

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { to7702KernelSmartAccount } from "permissionless/accounts"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const account = await to7702KernelSmartAccount({
    client: publicClient,
    owner: privateKeyToAccount("0x..."),
})

// Account address is the owner's EOA address
console.log(account.address)
```
