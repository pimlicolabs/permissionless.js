# ERC-7579 Utilities

Encoding and decoding for ERC-7579 execution calldata and module management. They live on the `Erc7579` namespace next to the [ERC-7579 actions](../actions/erc7579-actions.md).

## Import

```typescript
import { Erc7579 } from "permissionless"
import type { Erc7579 } from "permissionless"
// Erc7579.EncodeCallsParameters, Erc7579.DecodeCallsReturnType,
// Erc7579.EncodeInstallModuleParameters, Erc7579.EncodeUninstallModuleParameters,
// Erc7579.CallType, Erc7579.ExecutionMode, Erc7579.ModuleType
```

---

## `Erc7579.encodeCalls`

Encodes calls as `execute(bytes32 execMode, bytes executionCalldata)`.

### Signature

```typescript
function Erc7579.encodeCalls<callType extends Erc7579.CallType>(
    args: Erc7579.EncodeCallsParameters<callType>
): Hex
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mode` | `Erc7579.ExecutionMode<callType>` | Yes | Execution mode (below) |
| `callData` | `{ to: Address, value?: bigint, data?: Hex }[]` | Yes | Calls to execute |

```typescript
type CallType = "call" | "batchcall" | "delegatecall"

type ExecutionMode<callType extends CallType> = {
    type: callType
    revertOnError?: boolean
    selector?: Hex
    context?: Hex
}
```

A single call is packed as `target ‖ value ‖ callData`; several calls require `type: "batchcall"` and are ABI-encoded as `(address target, uint256 value, bytes callData)[]`.

### Errors

- `EmptyCallsError` -- empty `callData`
- `Erc7579InvalidExecutionModeError` -- several calls with a mode other than `batchcall`

### Example

```typescript
const data = Erc7579.encodeCalls({
    mode: { type: "batchcall", revertOnError: false, selector: "0x", context: "0x" },
    callData: [
        { to: "0xA...", value: 0n, data: "0x" },
        { to: "0xB...", value: 1000n, data: "0x1234" }
    ]
})
```

---

## `Erc7579.decodeCalls`

Decodes `execute` calldata back into its mode and calls.

### Signature

```typescript
function Erc7579.decodeCalls(callData: Hex): Erc7579.DecodeCallsReturnType
```

### Returns

```typescript
{
    mode: Erc7579.ExecutionMode<Erc7579.CallType>
    callData: { to: Address; value?: bigint; data?: Hex }[]
}
```

Throws `Erc7579InvalidCallTypeError` on an unknown call-type byte.

---

## `Erc7579.encodeInstallModule`

Builds the `installModule(uint256 moduleTypeId, address module, bytes initData)` call(s) for an account.

### Signature

```typescript
function Erc7579.encodeInstallModule(
    args: Erc7579.EncodeInstallModuleParameters
): { to: Address; value: bigint; data: Hex }[]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account` | `SmartAccount.SmartAccount` | Yes | The account installing the modules (calls target `account.address`) |
| `modules` | `{ type: ModuleType, address: Address, context: Hex }` or `{ type, address, initData: Hex }`, single or array | Yes | Modules to install |

```typescript
type ModuleType = "validator" | "executor" | "fallback" | "hook"
```

### Returns

One call per module, ready for `sendCalls` or the account's `encodeCalls`. Throws `AccountNotFoundError` without `account`.

---

## `Erc7579.encodeUninstallModule`

Builds the `uninstallModule(uint256 moduleTypeId, address module, bytes deInitData)` call(s).

### Signature

```typescript
function Erc7579.encodeUninstallModule(
    args: Erc7579.EncodeUninstallModuleParameters
): { to: Address; value: bigint; data: Hex }[]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account` | `SmartAccount.SmartAccount` | Yes | The account uninstalling the modules |
| `modules` | `{ type: ModuleType, address: Address, context: Hex }` or `{ type, address, deInitData: Hex }`, single or array | Yes | Modules to uninstall |

### Returns

One call per module. Throws `AccountNotFoundError` without `account`.

## Migrating from 0.x

- `encode7579Calls` / `decode7579Calls` / `encodeInstallModule` / `encodeUninstallModule` from the `utils` subpath -> `Erc7579.encodeCalls` / `decodeCalls` / `encodeInstallModule` / `encodeUninstallModule`.
- `EncodeCallDataParams` -> `Erc7579.EncodeCallsParameters`; `DecodeCallDataReturnType` -> `Erc7579.DecodeCallsReturnType`.
