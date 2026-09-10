# Public Actions

Public actions are read-only functions that interact with the EntryPoint contract. They don't require a smart account.

## Import

```typescript
import { getAccountNonce, getSenderAddress, InvalidEntryPointError } from "permissionless"
import type { GetAccountNonceParams, GetSenderAddressParams } from "permissionless"
```

---

## `getAccountNonce`

Reads the current nonce for a smart account from the EntryPoint contract.

### Signature

```typescript
async function getAccountNonce(
    client: Client,
    args: GetAccountNonceParams
): Promise<bigint>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | `Address` | Yes | -- | Smart account address |
| `entryPointAddress` | `Address` | Yes | -- | EntryPoint contract address |
| `key` | `bigint` | No | `0n` | Nonce key (for 2D nonce system) |

### Returns

`bigint` -- The current nonce value.

### Example

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { getAccountNonce } from "permissionless"
import { EntryPoint } from "viem/erc4337"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const nonce = await getAccountNonce(publicClient, {
    address: "0x1234...",
    entryPointAddress: EntryPoint.addressV07,
})

console.log("Current nonce:", nonce)
```

### With Nonce Key

```typescript
const nonce = await getAccountNonce(publicClient, {
    address: "0x1234...",
    entryPointAddress: EntryPoint.addressV07,
    key: 1n, // Use nonce lane 1
})
```

---

## `getSenderAddress`

Computes the counterfactual address of a smart account from its init code or factory parameters. This simulates the account deployment to determine the address without actually deploying.

### Signature

```typescript
async function getSenderAddress(
    client: Client,
    args: GetSenderAddressParams
): Promise<Address>
```

### Parameters

Accepts one of two parameter shapes:

**Shape 1: Combined init code (EntryPoint 0.6)**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `initCode` | `Hex` | Yes | Combined factory address + factory data |
| `entryPointAddress` | `Address` | Yes | EntryPoint contract address |

**Shape 2: Separated factory (EntryPoint 0.7/0.8)**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `factory` | `Address` | Yes | Factory contract address |
| `factoryData` | `Hex` | Yes | Factory calldata |
| `entryPointAddress` | `Address` | Yes | EntryPoint contract address |

### Returns

`Address` -- The counterfactual smart account address.

### Errors

- **`InitCodeRequiredError`** -- Neither `initCode` nor `factory` + `factoryData` was given
- **`InvalidEntryPointError`** -- `entryPointAddress` is not an EntryPoint (the helper call did not revert with `SenderAddressResult`)
- **`SenderAddressNotFoundError`** -- The helper call returned no data

### Example

```typescript
import { getSenderAddress } from "permissionless"
import { EntryPoint } from "viem/erc4337"

const address = await getSenderAddress(publicClient, {
    factory: "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985",
    factoryData: "0x...",
    entryPointAddress: EntryPoint.addressV07,
})

console.log("Counterfactual address:", address)
```

---

## `InvalidEntryPointError`

Thrown by `getSenderAddress` when `entryPointAddress` does not behave like an EntryPoint. The original viem `call` error is attached as `cause`.

```typescript
import { InvalidEntryPointError } from "permissionless"

try {
    const address = await getSenderAddress(client, params)
} catch (error) {
    if (error instanceof InvalidEntryPointError) {
        console.error("Invalid init code or EntryPoint:", error.message)
    }
}
```
