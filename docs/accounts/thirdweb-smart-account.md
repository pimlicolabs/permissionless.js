# ThirdwebSmartAccount

The Thirdweb smart account supports EntryPoint 0.6 and 0.7 with salt-based account derivation.

## Import

```typescript
import { ThirdwebSmartAccount } from "permissionless"
import type { ThirdwebSmartAccount } from "permissionless"
// ThirdwebSmartAccount.Parameters, ThirdwebSmartAccount.ReturnType,
// ThirdwebSmartAccount.Implementation, ThirdwebSmartAccount.Version
```

## Factory Function

```typescript
async function ThirdwebSmartAccount.from<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
>(
    parameters: ThirdwebSmartAccount.Parameters<entryPointVersion>
): Promise<ThirdwebSmartAccount.ReturnType<entryPointVersion>>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `"0.6" \| "0.7" \| { address: Address, version }` | No | `"0.7"` | EntryPoint to use |
| `version` | `"1.5.20"` | No | `"1.5.20"` | Account version |
| `factoryAddress` | `Address` | No | Per EntryPoint (below) | Factory contract |
| `salt` | `string` | No | -- | UTF-8 string salt for account derivation |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none (`getNonce({ key })` wins) |

Defaults are frozen for the 1.x line: omitting `entryPoint` or `version` derives the same address as passing the default explicitly.

### Default Factory Addresses

| EntryPoint | Factory Address |
|------------|----------------|
| 0.6 | `0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00` |
| 0.7 | `0x4bE0ddfebcA9A5A4a617dee4DeCe99E7c862dceb` |

## Supported EntryPoint Versions

- **0.6**
- **0.7** (default)

## Implementation Details

- **ERC-1271:** `signMessage` and `signTypedData` wrap the hash in the account's `AccountMessage` EIP-712 struct; typed data whose `verifyingContract` is the account itself is signed by the owner as-is
- **ERC-7579:** Not supported
- **Salt:** the string is UTF-8 encoded and passed to the factory as `bytes`

## Errors

- `ThirdwebNoCallsError` -- `encodeCalls([])`

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { ThirdwebSmartAccount } from "permissionless"

const account = await ThirdwebSmartAccount.from({
    client: Client.create({ chain: sepolia, transport: http() }),
    owner: Account.fromPrivateKey("0x...")
})
```

## Migrating from 0.x

- `toThirdwebSmartAccount` -> `ThirdwebSmartAccount.from`, imported from `permissionless` (the `permissionless/accounts/thirdweb` subpath is gone).
- `ToThirdwebSmartAccountParameters` / `ToThirdwebSmartAccountReturnType` / `ThirdwebSmartAccountImplementation` -> `ThirdwebSmartAccount.Parameters` / `.ReturnType` / `.Implementation`.
- `entryPoint` takes the `"0.7"` shorthand and is optional; `version` is optional. Omitting either derives the address the explicit 0.x form did.
- When neither the call nor the constructor supplies a nonce key, the key is `0n` (0.x fell through to viem's timestamp-derived key). Pass `getNonce({ key })` or `nonceKey` for parallel nonces.
- `THIRDWEB_ADDRESSES` and the unused `secp256k1VerificationFacetAddress` parameter are removed.
