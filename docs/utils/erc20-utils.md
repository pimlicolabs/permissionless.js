# ERC-20 Utilities

State override utilities for simulating ERC-20 token balances and allowances during gas estimation. These are used with viem's `stateOverride` parameter to simulate token states without requiring actual tokens.

## Import

```typescript
import { erc20AllowanceOverride, erc20BalanceOverride } from "permissionless/utils"
import type {
    Erc20AllowanceOverrideParameters,
    Erc20BalanceOverrideParameters,
} from "permissionless/utils"
```

---

## `erc20AllowanceOverride`

Creates a state override that simulates maximum ERC-20 token allowance for a spender. Useful for gas estimation when the actual approval hasn't been executed yet.

### Signature

```typescript
function erc20AllowanceOverride(
    args: Erc20AllowanceOverrideParameters
): StateOverride
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | `Address` | Yes | -- | ERC-20 token contract address |
| `owner` | `Address` | Yes | -- | Token owner address |
| `spender` | `Address` | Yes | -- | Spender to grant allowance to |
| `slot` | `bigint` | Yes | -- | Storage slot for the allowance mapping |
| `amount` | `bigint` | No | `maxUint256` | Allowance amount to simulate |

### Returns

`StateOverride` -- A viem state override object to pass to `eth_call` or gas estimation.

### Example

```typescript
import { erc20AllowanceOverride } from "permissionless/utils"

const override = erc20AllowanceOverride({
    token: "0xUsdcAddress...",
    owner: "0xSmartAccount...",
    spender: "0xPaymaster...",
    slot: 1n, // USDC allowance mapping slot
})
```

---

## `erc20BalanceOverride`

Creates a state override that simulates an ERC-20 token balance. Useful for gas estimation when the account doesn't hold the required tokens yet.

### Signature

```typescript
function erc20BalanceOverride(
    args: Erc20BalanceOverrideParameters
): StateOverride
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | `Address` | Yes | -- | ERC-20 token contract address |
| `owner` | `Address` | Yes | -- | Account to give balance to |
| `slot` | `bigint` | Yes | -- | Storage slot for the balance mapping |
| `amount` | `bigint` | No | `maxUint256` | Balance amount to simulate |

### Returns

`StateOverride` -- A viem state override object.

### Example

```typescript
import { erc20BalanceOverride } from "permissionless/utils"

const override = erc20BalanceOverride({
    token: "0xUsdcAddress...",
    owner: "0xSmartAccount...",
    slot: 0n, // USDC balance mapping slot
})
```

## Usage with Gas Estimation

Both overrides are typically combined when estimating gas for ERC-20 paymaster operations:

```typescript
const overrides = [
    erc20BalanceOverride({
        token: usdcAddress,
        owner: accountAddress,
        slot: 0n,
    }),
    erc20AllowanceOverride({
        token: usdcAddress,
        owner: accountAddress,
        spender: paymasterAddress,
        slot: 1n,
    }),
]
```
