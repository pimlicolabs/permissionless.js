# UserOperation Utilities

Functions for packing, estimating, and converting UserOperation data.

## Import

```typescript
import {
    getPackedUserOperation,
    getRequiredPrefund,
    deepHexlify,
    transactionReceiptStatus,
} from "permissionless/utils"

import type { GetRequiredPrefundReturnType } from "permissionless/utils"
```

---

## `getPackedUserOperation`

Packs a UserOperation (EntryPoint 0.7 format) into the packed representation used for gas estimation and on-chain submission. Combines separated fields back into packed form.

### Signature

```typescript
function getPackedUserOperation(
    userOperation: UserOperation<"0.7">
): PackedUserOperation
```

### Details

Internally packs:
- `initCode` from `factory` + `factoryData`
- `accountGasLimits` from `verificationGasLimit` + `callGasLimit`
- `gasFees` from `maxPriorityFeePerGas` + `maxFeePerGas`
- `paymasterAndData` from `paymaster` + `paymasterVerificationGasLimit` + `paymasterPostOpGasLimit` + `paymasterData`

---

## `getRequiredPrefund`

Computes the minimum amount of ETH that must be deposited in the smart account (or provided by a paymaster) to cover a UserOperation's gas costs.

### Signature

```typescript
function getRequiredPrefund<entryPointVersion extends EntryPointVersion>(
    args: {
        userOperation: UserOperation<entryPointVersion>,
        entryPointVersion: entryPointVersion,
    }
): GetRequiredPrefundReturnType<entryPointVersion>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation` | Yes | The UserOperation to estimate for |
| `entryPointVersion` | `EntryPointVersion` | Yes | `"0.6"`, `"0.7"`, or `"0.8"` |

### Returns

`bigint` -- The minimum required prefund in wei.

### Gas Formulas

**EntryPoint 0.6:**
```
requiredPrefund = (callGasLimit + verificationGasLimit * 3 + preVerificationGas) * maxFeePerGas
```

**EntryPoint 0.7/0.8:**
```
requiredPrefund = (callGasLimit + verificationGasLimit + paymasterVerificationGasLimit + paymasterPostOpGasLimit + preVerificationGas) * maxFeePerGas
```

### Example

```typescript
import { getRequiredPrefund } from "permissionless/utils"

const prefund = getRequiredPrefund({
    userOperation,
    entryPointVersion: "0.7",
})

console.log("Required prefund:", prefund, "wei")
```

---

## `deepHexlify`

Recursively converts all `bigint` values in an object tree to hex strings. Useful for preparing UserOperations for JSON-RPC transmission.

### Signature

```typescript
function deepHexlify(obj: any): any
```

### Example

```typescript
import { deepHexlify } from "permissionless/utils"

const hexified = deepHexlify({
    nonce: 5n,
    callGasLimit: 100000n,
    nested: { value: 42n },
})
// => { nonce: "0x5", callGasLimit: "0x186a0", nested: { value: "0x2a" } }
```

---

## `transactionReceiptStatus`

A constant mapping transaction receipt status codes to human-readable strings.

```typescript
const transactionReceiptStatus = {
    "0x0": "reverted",
    "0x1": "success",
} as const
```
