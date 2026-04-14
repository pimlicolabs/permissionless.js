# KernelSmartAccount

The Kernel smart account is a modular ERC-7579-compatible account supporting multiple validator types, including ECDSA and WebAuthn. It has versions for both EntryPoint 0.6 (v0.2.x) and 0.7 (v0.3.x).

## Import

```typescript
import { toKernelSmartAccount } from "permissionless/accounts"
import type {
    ToKernelSmartAccountParameters,
    ToKernelSmartAccountReturnType,
    KernelSmartAccountImplementation,
    KernelVersion,
} from "permissionless/accounts"
```

## Factory Function

```typescript
async function toKernelSmartAccount<
    entryPointVersion extends EntryPointVersion,
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<EthereumProvider | WalletClient | LocalAccount | WebAuthnAccount>,
    eip7702 extends boolean = false
>(
    parameters: ToKernelSmartAccountParameters<entryPointVersion, kernelVersion, owner, eip7702>
): Promise<ToKernelSmartAccountReturnType<entryPointVersion, eip7702>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owners` | `[LocalAccount \| WalletClient \| EthereumProvider \| WebAuthnAccount]` | Yes | -- | Single owner in array |
| `version` | `KernelVersion` | No | Defaults by EP version | Kernel version |
| `entryPoint` | `{ address: Address, version: EntryPointVersion }` | No | `"0.7"` | EntryPoint to use |
| `factoryAddress` | `Address` | No | Version-specific | Factory contract |
| `metaFactoryAddress` | `Address` | No | Version-specific | Meta-factory for delegated deploys |
| `accountLogicAddress` | `Address` | No | Version-specific | Account implementation |
| `validatorAddress` | `Address` | No | Version-specific | Default validator contract |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |
| `useMetaFactory` | `boolean \| "optional"` | No | -- | Use meta-factory for deployment |

## KernelVersion

The `KernelVersion` type depends on EntryPoint version:

| EntryPoint | Available Versions |
|------------|-------------------|
| 0.6 | `"0.2.1"`, `"0.2.2"`, `"0.2.3"`, `"0.2.4"` |
| 0.7 | `"0.3.0-beta"`, `"0.3.1"`, `"0.3.2"`, `"0.3.3"` |

## Supported EntryPoint Versions

- **0.6** -- With Kernel v0.2.x
- **0.7** -- With Kernel v0.3.x (default)

## Implementation Details

- **Signing:** Validator-prepended signatures for ERC-1271 compliance
- **ERC-7579:** Full support in v0.3.x (validators, executors, fallbacks, hooks)
- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **WebAuthn:** Supported via WebAuthnAccount owner type
- **EIP-7702:** Supported via `eip7702` flag (see [EIP-7702 doc](../concepts/04-eip-7702.md))

## Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toKernelSmartAccount } from "permissionless/accounts"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const owner = privateKeyToAccount("0x...")

const account = await toKernelSmartAccount({
    client: publicClient,
    owners: [owner],
    version: "0.3.1",
})
```

### With Specific EntryPoint

```typescript
import { entryPoint07Address } from "viem/account-abstraction"

const account = await toKernelSmartAccount({
    client: publicClient,
    owners: [owner],
    version: "0.3.1",
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})
```
