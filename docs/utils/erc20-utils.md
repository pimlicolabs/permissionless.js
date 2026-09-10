# ERC-20 Utilities

State overrides that let gas estimation succeed before the account holds or has approved the token. They live on the `Erc20Paymaster` namespace in `permissionless/pimlico`, next to the [ERC-20 paymaster actions](../actions/erc20-paymaster.md).

## Import

```typescript
import { Erc20Paymaster } from "permissionless/pimlico"
import type { Erc20Paymaster } from "permissionless/pimlico"
// Erc20Paymaster.BalanceOverrideParameters, Erc20Paymaster.AllowanceOverrideParameters
```

---

## `Erc20Paymaster.balanceOverride`

Simulates an ERC-20 balance for `owner`.

### Signature

```typescript
function Erc20Paymaster.balanceOverride(
    args: Erc20Paymaster.BalanceOverrideParameters
): StateOverrides.StateOverrides
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | `Address` | Yes | -- | ERC-20 token contract |
| `owner` | `Address` | Yes | -- | Account whose balance is simulated |
| `slot` | `bigint` | Yes | -- | Storage slot of the token's balance mapping |
| `balance` | `bigint` | No | A large sentinel | Simulated balance |

### Returns

A viem `StateOverrides.StateOverrides` object keyed by `token`, whose `stateDiff` sets the balance slot for `owner` (`keccak256(abi.encode(owner, slot))`).

### Example

```typescript
const stateOverride = Erc20Paymaster.balanceOverride({
    token: "0xUsdc...",
    owner: account.address,
    slot: 9n
})
```

---

## `Erc20Paymaster.allowanceOverride`

Simulates an ERC-20 allowance from `owner` to `spender`.

### Signature

```typescript
function Erc20Paymaster.allowanceOverride(
    args: Erc20Paymaster.AllowanceOverrideParameters
): StateOverrides.StateOverrides
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | `Address` | Yes | -- | ERC-20 token contract |
| `owner` | `Address` | Yes | -- | Token owner |
| `spender` | `Address` | Yes | -- | Spender granted the allowance |
| `slot` | `bigint` | Yes | -- | Storage slot of the token's allowance mapping |
| `amount` | `bigint` | No | `2n ** 255n - 1n` | Simulated allowance |

### Returns

A viem `StateOverrides.StateOverrides` object keyed by `token`, whose `stateDiff` sets the allowance slot for `owner` and `spender`.

### Example

```typescript
const stateOverride = Erc20Paymaster.allowanceOverride({
    token: "0xUsdc...",
    owner: account.address,
    spender: paymaster,
    slot: 10n
})
```

## Usage

Pass the result as `stateOverride` to `userOperation.prepare` or `userOperation.estimateGas`. When combining both overrides for the same token, merge their `stateDiff` entries, as `Erc20Paymaster.prepareUserOperation` does. Pimlico's `pimlico_getTokenQuotes` response carries `balanceSlot` and `allowanceSlot` for supported tokens.
