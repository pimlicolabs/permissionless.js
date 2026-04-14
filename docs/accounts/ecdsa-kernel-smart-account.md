# EcdsaKernelSmartAccount

> **Note:** This account is a convenience wrapper around `toKernelSmartAccount`. For new integrations, prefer using `toKernelSmartAccount` directly.

The ECDSA Kernel smart account wraps `toKernelSmartAccount` with an explicit `ecdsaValidatorAddress` parameter.

## Import

```typescript
import { toEcdsaKernelSmartAccount } from "permissionless/accounts"
import type {
    ToEcdsaKernelSmartAccountParameters,
    ToEcdsaKernelSmartAccountReturnType,
    EcdsaKernelSmartAccountImplementation,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toEcdsaKernelSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<EthereumProvider | WalletClient | LocalAccount>
>(
    parameters: ToEcdsaKernelSmartAccountParameters<entryPointVersion, kernelVersion, owner>
): Promise<ToEcdsaKernelSmartAccountReturnType<entryPointVersion>>
```

## Parameters

Inherits all parameters from `toKernelSmartAccount` plus:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ecdsaValidatorAddress` | `Address` | No | Default ECDSA validator | Custom ECDSA validator contract |

See [KernelSmartAccount](./kernel-smart-account.md) for all other parameters.

## Implementation Details

Internally maps `ecdsaValidatorAddress` to `validatorAddress` and calls `toKernelSmartAccount`.

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toEcdsaKernelSmartAccount } from "permissionless/accounts"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const account = await toEcdsaKernelSmartAccount({
    client: publicClient,
    owners: [privateKeyToAccount("0x...")],
    version: "0.3.1",
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})
```
