# LightSmartAccount

Alchemy's Light Account is a gas-optimised single-owner account with ERC-1271 support. Light Account 1.1.0 runs on EntryPoint 0.6, Light Account 2.0.0 on EntryPoint 0.7.

## Import

```typescript
import { LightSmartAccount } from "permissionless"
import type { LightSmartAccount } from "permissionless"
// LightSmartAccount.Parameters, LightSmartAccount.ReturnType,
// LightSmartAccount.Implementation, LightSmartAccount.Version
```

## Constructor

```typescript
async function LightSmartAccount.from<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
>(
    parameters: LightSmartAccount.Parameters<entryPointVersion>
): Promise<LightSmartAccount.ReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `"0.6" \| "0.7" \| { address, version }` | No | `"0.7"` | EntryPoint to use |
| `version` | `LightSmartAccount.Version<entryPointVersion>` | No | `"2.0.0"` on 0.7, `"1.1.0"` on 0.6 | Light Account version, derived from the EntryPoint when omitted |
| `factoryAddress` | `Address` | No | Per version (below) | Factory contract |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none (`getNonce({ key })` wins) |

Defaults are frozen for the 1.x line: `from({ client, owner })` derives the same address as `{ entryPoint: "0.7", version: "2.0.0" }`, and `{ entryPoint: "0.6" }` the same as `{ entryPoint: "0.6", version: "1.1.0" }`.

### Version

| Version | EntryPoint | Factory |
|---------|------------|---------|
| `"1.1.0"` | 0.6 | `0x00004EC70002a32400f8ae005A26081065620D20` |
| `"2.0.0"` | 0.7 | `0x0000000000400CdFef5E2714E63d8040b700BC24` |

The mapping is one-to-one, so `Version` is conditional on the EntryPoint:

```typescript
type Version<entryPointVersion extends "0.6" | "0.7" = "0.6" | "0.7"> =
    entryPointVersion extends "0.6" ? "1.1.0" : "2.0.0"
```

A `version` that does not match the EntryPoint throws `LightSmartAccountUnsupportedVersionError`.

### Nonce keys

`account.getNonce({ key })` resolves the key as the per-call `key`, then the constructor `nonceKey`, then `0n`. The key is passed to the EntryPoint unchanged.

## Implementation Details

- **ERC-1271:** `signMessage`, `signTypedData` and `sign({ hash })` sign the `LightAccountMessage(bytes message)` EIP-712 struct (domain `LightAccount`, version `"1"` on 1.1.0 and `"2"` on 2.0.0). The result verifies on-chain, and through ERC-6492 before deployment, on both versions.
- **Signature prefix:** on 2.0.0 every signature, including the UserOperation signature and the stub, carries the `0x00` EOA signature-type byte.
- **UserOperation signing:** the owner personal-signs the UserOperation hash.
- **Execution ABI:** `execute(address dest, uint256 value, bytes func)` and `executeBatch(address[] dest, uint256[] value, bytes[] func)`.
- **ERC-7579:** Not supported.

## Errors

- `EmptyCallsError` -- `encodeCalls([])`
- `LightSmartAccountUnsupportedVersionError` -- `version` does not match the EntryPoint (1.1.0 needs 0.6, 2.0.0 needs 0.7)

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { LightSmartAccount } from "permissionless"

const account = await LightSmartAccount.from({
    client: Client.create({ chain: sepolia, transport: http() }),
    owner: Account.fromPrivateKey("0x...")
})
```

### Light Account 1.1.0

```typescript
const account = await LightSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: "0.6"
})
```

## Migrating from 0.x

- The 0.x factory function -> `LightSmartAccount.from`, imported from `permissionless` (the `accounts` subpath is gone).
- `ToLightSmartAccountParameters` / `ToLightSmartAccountReturnType` / `LightSmartAccountImplementation` / `LightAccountVersion` -> `LightSmartAccount.Parameters` / `.ReturnType` / `.Implementation` / `.Version`.
- `version` is optional and derived from `entryPoint`; `entryPoint` takes the `"0.7"` shorthand. Omitting either derives the address the explicit 0.x form did.
- 2.0.0 signature bytes changed: 0.x signed with the version `"1"` domain, so they never verified on-chain. 1.0 signatures do.
- When neither the call nor the constructor supplies a nonce key, the key is `0n` (0.x fell through to viem's timestamp-derived key). Pass `getNonce({ key })` or `nonceKey` for parallel nonces.
