# ERC-7579 Utilities

Encoding and decoding utilities for ERC-7579 modular smart account calls and module management.

## Import

```typescript
import {
    encode7579Calls,
    decode7579Calls,
    encodeInstallModule,
    encodeUninstallModule,
} from "permissionless/utils"

import type {
    EncodeCallDataParams,
    DecodeCallDataReturnType,
    EncodeInstallModuleParameters,
    EncodeUninstallModuleParameters,
} from "permissionless/utils"
```

---

## `encode7579Calls`

Encodes calls into the ERC-7579 execute format, including the execution mode byte.

### Signature

```typescript
function encode7579Calls(args: EncodeCallDataParams): Hex
```

### Parameters

The function accepts different parameter shapes based on the call type:

**Single call:**
```typescript
{
    mode: { type: "call", revertOnError?: boolean, selector?: Hex, context?: Hex },
    callData: [{ to: Address, value: bigint, data: Hex }]
}
```

**Batch call:**
```typescript
{
    mode: { type: "batchcall", revertOnError?: boolean, selector?: Hex, context?: Hex },
    callData: [{ to: Address, value: bigint, data: Hex }, ...]
}
```

**Delegate call:**
```typescript
{
    mode: { type: "delegatecall", revertOnError?: boolean, selector?: Hex, context?: Hex },
    callData: [{ to: Address, value: bigint, data: Hex }]
}
```

### Mode Bytes

| Type | Byte Value |
|------|-----------|
| `"call"` | `0x00` |
| `"batchcall"` | `0x01` |
| `"delegatecall"` | `0xff` |

### Example

```typescript
import { encode7579Calls } from "permissionless/utils"

const calldata = encode7579Calls({
    mode: { type: "batchcall" },
    callData: [
        { to: "0xA...", value: 0n, data: "0x" },
        { to: "0xB...", value: 1000n, data: "0x1234" },
    ],
})
```

---

## `decode7579Calls`

Decodes ERC-7579 execute calldata back into mode and individual calls.

### Signature

```typescript
function decode7579Calls(callData: Hex): DecodeCallDataReturnType
```

### Returns

```typescript
type DecodeCallDataReturnType = {
    mode: "call" | "batchcall" | "delegatecall",
    calls: { to: Address, value: bigint, data: Hex }[]
}
```

### Example

```typescript
import { decode7579Calls } from "permissionless/utils"

const decoded = decode7579Calls("0x...")
console.log(decoded.mode) // "batchcall"
console.log(decoded.calls) // [{ to: "0xA...", value: 0n, data: "0x" }, ...]
```

---

## `encodeInstallModule`

Encodes a call to `installModule(uint256 moduleType, address module, bytes initData)` for ERC-7579 accounts.

### Signature

```typescript
function encodeInstallModule(args: EncodeInstallModuleParameters): Hex
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `ModuleType` | Yes | Module type (`"validator"`, `"executor"`, `"fallback"`, `"hook"`) |
| `address` | `Address` | Yes | Module contract address |
| `context` | `Hex` | Yes | Initialization data |

### Returns

`Hex` -- ABI-encoded calldata for the `installModule` function.

---

## `encodeUninstallModule`

Encodes a call to `uninstallModule(uint256 moduleType, address module, bytes deInitData)`.

### Signature

```typescript
function encodeUninstallModule(args: EncodeUninstallModuleParameters): Hex
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `ModuleType` | Yes | Module type |
| `address` | `Address` | Yes | Module contract address |
| `context` | `Hex` | Yes | De-initialization data |

### Returns

`Hex` -- ABI-encoded calldata for the `uninstallModule` function.
