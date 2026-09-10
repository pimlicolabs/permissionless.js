# SimpleSmartAccount

The Simple smart account is the eth-infinitism reference ERC-4337 account with single-owner ECDSA validation. It supports EntryPoint 0.6, 0.7, 0.8 and 0.9, and EIP-7702 delegation on 0.8 and 0.9.

## Import

```typescript
import { SimpleSmartAccount } from "permissionless"
import type { SimpleSmartAccount } from "permissionless"
// SimpleSmartAccount.Parameters, SimpleSmartAccount.ReturnType, SimpleSmartAccount.Implementation
```

## Constructor

```typescript
async function SimpleSmartAccount.from<
    entryPointVersion extends "0.6" | "0.7" | "0.8" | "0.9" = "0.8",
    eip7702 extends boolean = false
>(
    parameters: SimpleSmartAccount.Parameters<entryPointVersion, eip7702>
): Promise<SimpleSmartAccount.ReturnType<entryPointVersion, eip7702>>
```

Simple is unversioned: there is no `version` parameter and no `Version` type.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | -- | ECDSA key that controls the account |
| `entryPoint` | `"0.6" \| "0.7" \| "0.8" \| "0.9" \| { address, version }` | No | `"0.8"` | EntryPoint to use; the shorthand resolves to the canonical address |
| `factoryAddress` | `Address` | No | Per EntryPoint (below) | Factory contract. Required on 0.9; not available with `eip7702` |
| `index` | `bigint` | No | `0n` | Salt for deterministic address. Not available with `eip7702` |
| `address` | `Address` | No | Computed | Override counterfactual address. Not available with `eip7702` |
| `nonceKey` | `bigint` | No | `0n` | Nonce key used when a call passes none (`getNonce({ key })` wins) |
| `eip7702` | `boolean` | No | `false` | Use the owner EOA as the account, delegated to the SimpleAccount implementation (see [EIP-7702 mode](#eip-7702-mode)) |
| `implementation` | `Address` | No | Per EntryPoint (below) | Delegate contract. Only available with `eip7702` |

Defaults are frozen for the 1.x line: omitting `entryPoint` derives the same address as passing `"0.8"` explicitly.

### Default Factory Addresses

| EntryPoint | Factory |
|------------|---------|
| 0.6 | `0x9406Cc6185a346906296840746125a0E44976454` |
| 0.7 | `0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985` |
| 0.8 | `0x13E9ed32155810FDbd067D4522C492D6f68E5944` |
| 0.9 | none; `factoryAddress` is required |

### Nonce keys

`account.getNonce({ key })` resolves the key as the per-call `key`, then the constructor `nonceKey`, then `0n`. The key is passed to the EntryPoint unchanged (full 192-bit width).

## EIP-7702 mode

With `eip7702: true` the account is the owner EOA itself, delegated to the SimpleAccount implementation:

- `entryPoint` is typed `"0.8" | "0.9"` and still defaults to `"0.8"`.
- `account.address` is `owner.address`. No factory is involved: `getFactoryArgs()` returns `{ factory: undefined, factoryData: undefined }`.
- `account.authorization` is `{ account: owner, address: implementation }`. You sign the authorization yourself (`owner.signAuthorization({ address: account.authorization.address, chainId, nonce })`) and pass it as `authorization` on the UserOperation that delegates the EOA.
- `implementation` defaults to `0xe6Cae83BdE06E4c305530e199D7217f42808555B` on 0.8 and `0xa46cc63eBF4Bd77888AA327837d20b23A63a56B5` on 0.9.
- `factoryAddress`, `index` and `address` are not available; `nonceKey` is.

See [EIP-7702 Delegation](../concepts/04-eip-7702.md).

## Implementation Details

- **Signing:** `signUserOperation` personal-signs the UserOperation hash on 0.6 and 0.7 and signs the EIP-712 UserOperation typed data on 0.8 and 0.9.
- **ERC-1271:** Not supported by SimpleAccount. `sign`, `signMessage` and `signTypedData` throw `SimpleAccountErc1271UnsupportedError` rather than returning a signature no verifier accepts.
- **ERC-7579:** Not supported.
- **Batch execution ABI:**
  - 0.6: `executeBatch(address[] dest, bytes[] func)`
  - 0.7: `executeBatch(address[] dest, uint256[] value, bytes[] func)`
  - 0.8 and 0.9: `executeBatch((address target, uint256 value, bytes data)[] calls)`

## Errors

- `EmptyCallsError` -- `encodeCalls([])`
- `SimpleAccountErc1271UnsupportedError` -- `sign`, `signMessage`, `signTypedData`
- `SimpleAccountFactoryAddressRequiredError` -- EntryPoint 0.9 without `factoryAddress` (outside EIP-7702 mode)
- ox `AbiItem.NotFoundError` -- `decodeCalls` on data that is neither `execute` nor `executeBatch`

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { SimpleSmartAccount } from "permissionless"

const publicClient = Client.create({ chain: sepolia, transport: http() })
const owner = Account.fromPrivateKey("0x...")

const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner
})
```

### With EntryPoint 0.7

```typescript
const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: "0.7"
})
```

### EIP-7702

```typescript
import { SmartAccountClient } from "permissionless"

const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner,
    eip7702: true
})

account.address === owner.address // true

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com")
})
```

### EntryPoint 0.9

```typescript
const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: "0.9",
    factoryAddress: "0x..."
})
```

## Migrating from 0.x

- The 0.x factory function and the separate EIP-7702 factory -> `SimpleSmartAccount.from`, imported from `permissionless` (the `accounts` subpath is gone). EIP-7702 mode is `eip7702: true` on the same function.
- `ToSimpleSmartAccountParameters` / `ToSimpleSmartAccountReturnType` / `SimpleSmartAccountImplementation` and the `To7702SimpleSmartAccount*` trio -> `SimpleSmartAccount.Parameters<entryPointVersion, eip7702>` / `.ReturnType` / `.Implementation`.
- The default EntryPoint moved from 0.7 to 0.8. Pass `entryPoint: "0.7"` to keep deriving a 0.x address.
- `entryPoint` takes the version shorthand; `accountLogicAddress` -> `implementation`; `nonceKey` is allowed in EIP-7702 mode.
- When neither the call nor the constructor supplies a nonce key, the key is `0n` (0.x fell through to viem's timestamp-derived key). Pass `getNonce({ key })` or `nonceKey` for parallel nonces.
- EntryPoint 0.9 is new. Upstream publishes no SimpleAccountFactory for it, so `factoryAddress` is required.
