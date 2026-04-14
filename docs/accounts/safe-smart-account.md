# SafeSmartAccount

The Safe smart account (formerly Gnosis Safe) is a multi-owner account with support for WebAuthn, ERC-7579 modules, and multiple Safe versions.

## Import

```typescript
import { toSafeSmartAccount } from "permissionless/accounts"
import type {
    ToSafeSmartAccountParameters,
    ToSafeSmartAccountReturnType,
    SafeSmartAccountImplementation,
    SafeVersion,
} from "permissionless/accounts"
```

### Safe Subpath

Additional Safe-specific utilities are available from a dedicated subpath:

```typescript
import { SafeSmartAccount } from "permissionless/accounts/safe"
// SafeSmartAccount.toSafeSmartAccount
// SafeSmartAccount.signUserOperation
```

## Factory Function

```typescript
async function toSafeSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    TErc7579 extends Address | undefined
>(
    parameters: ToSafeSmartAccountParameters<entryPointVersion, TErc7579>
): Promise<ToSafeSmartAccountReturnType>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client` | Yes | -- | viem client for on-chain reads |
| `owners` | `(LocalAccount \| WalletClient \| WebAuthnAccount)[]` | Yes | -- | Array of owners (multi-sig) |
| `version` | `SafeVersion` | Yes | -- | `"1.4.1"` or `"1.5.0"` |
| `threshold` | `bigint` | No | `1n` | Signature threshold for multi-sig |
| `entryPoint` | `{ address: Address, version: "0.6" \| "0.7" }` | No | `"0.7"` | EntryPoint to use |
| `safe4337ModuleAddress` | `Address` | No | Version-specific | 4337 module address |
| `erc7579LaunchpadAddress` | `Address` | No | undefined | ERC-7579 launchpad (enables module support) |
| `safeProxyFactoryAddress` | `Address` | No | Version-specific | Proxy factory |
| `safeSingletonAddress` | `Address` | No | Version-specific | Safe singleton |
| `safeWebAuthnSharedSignerAddress` | `Address` | No | Version-specific | WebAuthn signer |
| `safeP256VerifierAddress` | `Address` | No | Version-specific | P256 verifier for passkeys |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `saltNonce` | `bigint` | No | `0n` | Salt for address computation |
| `validUntil` | `number` | No | `0` | Signature validity end timestamp |
| `validAfter` | `number` | No | `0` | Signature validity start timestamp |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key |
| `paymentToken` | `Address` | No | -- | Token for gas payment |
| `payment` | `bigint` | No | -- | Gas payment amount |
| `paymentReceiver` | `Address` | No | -- | Gas payment recipient |
| `onchainIdentifier` | `Hex` | No | -- | On-chain identifier suffix |
| `useMultiSendForSetup` | `boolean` | No | `false` | Use MultiSend for account setup (avoids skipping MultiSend setup for single transactions) |

## SafeVersion

```typescript
type SafeVersion = "1.4.1" | "1.5.0"
```

- **1.4.1** -- Used with EntryPoint 0.6
- **1.5.0** -- Used with EntryPoint 0.7 (recommended)

## Supported EntryPoint Versions

- **0.6** -- With Safe v1.4.1
- **0.7** -- With Safe v1.5.0 (default)

## Implementation Details

- **Multi-owner:** Supports multiple owners with configurable threshold
- **WebAuthn:** One WebAuthn account supported per Safe (for passkey authentication)
- **ERC-7579:** Supported when `erc7579LaunchpadAddress` is provided
- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **Signing:** Multi-sig signatures are concatenated and sorted by owner address

## Example

### Single Owner

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toSafeSmartAccount } from "permissionless/accounts"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const owner = privateKeyToAccount("0x...")

const account = await toSafeSmartAccount({
    client: publicClient,
    owners: [owner],
    version: "1.5.0",
})
```

### Multi-Owner (2-of-3)

```typescript
const account = await toSafeSmartAccount({
    client: publicClient,
    owners: [owner1, owner2, owner3],
    threshold: 2n,
    version: "1.5.0",
})
```

### With ERC-7579 Modules

```typescript
const account = await toSafeSmartAccount({
    client: publicClient,
    owners: [owner],
    version: "1.5.0",
    erc7579LaunchpadAddress: "0x...",
})
```
