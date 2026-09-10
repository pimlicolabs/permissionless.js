# UserOperation Utilities

## Import

```typescript
import { getRequiredPrefund } from "permissionless"
import type { GetRequiredPrefundReturnType } from "permissionless"
```

---

## `getRequiredPrefund`

Minimum amount the sender (or its paymaster) must have deposited in the EntryPoint to cover a UserOperation.

### Signature

```typescript
function getRequiredPrefund<entryPointVersion extends EntryPoint.Version>(args: {
    userOperation: UserOperation.UserOperation<entryPointVersion>
    entryPointVersion: entryPointVersion
}): bigint
```

`GetRequiredPrefundReturnType<entryPointVersion>` is the type of `args`; the name predates 1.0.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation.UserOperation<entryPointVersion>` | Yes | The UserOperation to estimate for |
| `entryPointVersion` | `"0.6" \| "0.7" \| "0.8" \| "0.9"` | Yes | Selects the formula |

### Returns

`bigint` -- the required prefund in wei.

### Formulas

**EntryPoint 0.6:**

```
requiredPrefund = (callGasLimit + verificationGasLimit * m + preVerificationGas) * maxFeePerGas
```

where `m` is `3` when `paymasterAndData` is non-empty and `1` otherwise.

**EntryPoint 0.7, 0.8, 0.9:**

```
requiredPrefund = (callGasLimit + verificationGasLimit + paymasterVerificationGasLimit + paymasterPostOpGasLimit + preVerificationGas) * maxFeePerGas
```

### Example

```typescript
const prefund = getRequiredPrefund({
    userOperation,
    entryPointVersion: "0.7"
})
```

---

## Removed in 1.0

`getPackedUserOperation`, `deepHexlify` and `transactionReceiptStatus` are no longer exported. viem 3's `UserOperation` namespace (`viem/erc4337`) provides `UserOperation.hash` and `UserOperation.toTypedData`, and its bundler client serialises UserOperations for JSON-RPC itself.
