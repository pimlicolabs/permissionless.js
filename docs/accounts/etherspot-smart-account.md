# EtherspotSmartAccount

The Etherspot modular account is an ERC-7579 account deployed through Etherspot's meta-factory and bootstrap, with a single ECDSA validator. It supports EntryPoint 0.7 only.

## Import

```typescript
import { EtherspotSmartAccount } from "permissionless"
import type { EtherspotSmartAccount } from "permissionless"
// EtherspotSmartAccount.Parameters, EtherspotSmartAccount.ReturnType, EtherspotSmartAccount.Implementation
```

## Constructor

```typescript
async function EtherspotSmartAccount.from(
    parameters: EtherspotSmartAccount.Parameters
): Promise<EtherspotSmartAccount.ReturnType>
```

Etherspot is unversioned: there is no `version` parameter and no `Version` type.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key registered with the validator |
| `entryPoint` | `"0.7" \| { address: Address, version: "0.7" }` | No | `"0.7"` | EntryPoint 0.7 is the only supported version |
| `metaFactoryAddress` | `Address` | No | `0x2A40091f044e48DEB5C0FCbc442E443F3341B451` | Meta-factory that deploys the account |
| `bootstrapAddress` | `Address` | No | `0x0D5154d7751b6e2fDaa06F0cC9B400549394C8AA` | Bootstrap contract that installs the validator |
| `validatorAddress` | `Address` | No | `0x0740Ed7c11b9da33d9C80Bd76b826e4E90CC1906` | MultipleOwnerECDSAValidator |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none (`getNonce({ key })` wins); at most `65535` |

Defaults are frozen for the 1.x line: omitting `entryPoint` derives the same address as passing `"0.7"` explicitly.

### Nonce keys

`account.getNonce({ key })` resolves the key as the per-call `key`, then the constructor `nonceKey`, then `0n`, and packs it into the Etherspot nonce layout (validator address, two zero bytes, two-byte key). A key above `65535` throws `EtherspotNonceKeyOverflowError`.

## Implementation Details

- **ERC-7579:** calls are encoded with `Erc7579.encodeCalls` (`call` for one call, `batchcall` for several) and decoded with `Erc7579.decodeCalls`.
- **Signing:** `signMessage`, `signTypedData` and `sign` prefix the owner's signature with the validator address and normalise `v` to 27/28.
- **ERC-1271:** `signMessage` and `signTypedData` have the owner sign the message or typed data as-is; `sign({ hash })` has the owner personal-sign the 32-byte hash, which the validator accepts next to the raw form. All three verify on-chain, and through ERC-6492 before deployment.
- **UserOperation signing:** the owner personal-signs the UserOperation hash, without the validator prefix (the nonce key names the validator).

## Errors

- `EmptyCallsError` -- `encodeCalls([])`
- `EtherspotNonceKeyOverflowError` -- nonce key above `65535`

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { EtherspotSmartAccount } from "permissionless"

const account = await EtherspotSmartAccount.from({
    client: Client.create({ chain: sepolia, transport: http() }),
    owner: Account.fromPrivateKey("0x...")
})
```

## Migrating from 0.x

- The 0.x factory function -> `EtherspotSmartAccount.from`, imported from `permissionless` (the `accounts` subpath is gone).
- `ToEtherspotSmartAccountParameters` / `ToEtherspotSmartAccountReturnType` / `EtherspotSmartAccountImplementation` -> `EtherspotSmartAccount.Parameters` / `.ReturnType` / `.Implementation`.
- `owners: [owner]` -> `owner`.
- `entryPoint` is typed `"0.7"` only (0.x accepted `"0.6"` in the type but always built a 0.7 account) and takes the shorthand; omitting it derives the 0.x address.
- A per-call `getNonce({ key })` is honoured (0.x ignored it). Keys above `65535` throw `EtherspotNonceKeyOverflowError` instead of an ox size error.
