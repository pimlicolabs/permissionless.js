# ERC-7579 Actions

ERC-7579 actions manage modular smart account modules: install, uninstall, and query module support. These actions work with any ERC-7579 compatible account (Safe with launchpad, Kernel v3+, Etherspot, Nexus).

## Import

```typescript
import {
    erc7579Actions,
    accountId,
    installModule,
    installModules,
    uninstallModule,
    uninstallModules,
    isModuleInstalled,
    supportsModule,
    supportsExecutionMode,
} from "permissionless/actions/erc7579"

import type {
    Erc7579Actions,
    InstallModuleParameters,
    InstallModulesParameters,
    UninstallModuleParameters,
    UninstallModulesParameters,
    IsModuleInstalledParameters,
    SupportsModuleParameters,
    SupportsExecutionModeParameters,
    ModuleType,
    CallType,
    ExecutionMode,
} from "permissionless/actions/erc7579"
```

## `erc7579Actions` Decorator

Factory returning a decorator that adds all ERC-7579 methods to a client:

```typescript
import { erc7579Actions } from "permissionless/actions/erc7579"

const client = createSmartAccountClient({ ... })
    .extend(erc7579Actions())
```

---

## Module Types

```typescript
type ModuleType = "validator" | "executor" | "fallback" | "hook"
```

| Type | Description |
|------|-------------|
| `"validator"` | Validates UserOperation signatures |
| `"executor"` | Executes arbitrary logic on behalf of the account |
| `"fallback"` | Handles unrecognized function calls |
| `"hook"` | Pre/post execution hooks |

---

## `accountId`

Gets the ERC-7579 account identifier string.

```typescript
async function accountId(
    client: Client,
    args?: { account?: SmartAccount }
): Promise<string>
```

### Example

```typescript
const id = await client.accountId()
// e.g., "kernel.advanced.v0.3.1"
```

---

## `installModule`

Installs a single module on the account.

```typescript
async function installModule(
    client: Client,
    args: InstallModuleParameters
): Promise<Hash>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `ModuleType` | Yes | Module type to install |
| `address` | `Address` | Yes | Module contract address |
| `context` | `Hex` | Yes | Module initialization data |
| `account` | `SmartAccount` | No | Override client's account |

### Example

```typescript
const hash = await client.installModule({
    type: "executor",
    address: "0xModuleAddress...",
    context: "0x", // Module-specific init data
})
```

---

## `installModules`

Installs multiple modules in a single UserOperation.

```typescript
async function installModules(
    client: Client,
    args: InstallModulesParameters
): Promise<Hash>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modules` | `{ type: ModuleType, address: Address, context: Hex }[]` | Yes | Modules to install |
| `account` | `SmartAccount` | No | Override client's account |

---

## `uninstallModule`

Uninstalls a single module from the account.

```typescript
async function uninstallModule(
    client: Client,
    args: UninstallModuleParameters
): Promise<Hash>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `ModuleType` | Yes | Module type to uninstall |
| `address` | `Address` | Yes | Module contract address |
| `context` | `Hex` | Yes | Module deinitialization data |
| `account` | `SmartAccount` | No | Override client's account |

---

## `uninstallModules`

Uninstalls multiple modules in a single UserOperation.

```typescript
async function uninstallModules(
    client: Client,
    args: UninstallModulesParameters
): Promise<Hash>
```

---

## `isModuleInstalled`

Checks if a module is currently installed on the account.

```typescript
async function isModuleInstalled(
    client: Client,
    args: IsModuleInstalledParameters
): Promise<boolean>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `ModuleType` | Yes | Module type to check |
| `address` | `Address` | Yes | Module contract address |
| `context` | `Hex` | Yes | Additional context |
| `account` | `SmartAccount` | No | Override client's account |

### Example

```typescript
const installed = await client.isModuleInstalled({
    type: "validator",
    address: "0xModuleAddress...",
    context: "0x",
})

console.log("Module installed:", installed) // true or false
```

---

## `supportsModule`

Checks if the account supports a specific module type.

```typescript
async function supportsModule(
    client: Client,
    args: SupportsModuleParameters
): Promise<boolean>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `ModuleType` | Yes | Module type to check |
| `account` | `SmartAccount` | No | Override client's account |

---

## `supportsExecutionMode`

Checks if the account supports a specific execution mode.

```typescript
async function supportsExecutionMode(
    client: Client,
    args: SupportsExecutionModeParameters
): Promise<boolean>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `CallType` | Yes | Execution mode type |
| `revertOnError` | `boolean` | No | Revert behavior |
| `selector` | `Hex` | No | Function selector |
| `context` | `Hex` | No | Additional context |
| `account` | `SmartAccount` | No | Override client's account |

### CallType

```typescript
type CallType = "call" | "batchcall" | "delegatecall"
```

### Example

```typescript
const supportsBatch = await client.supportsExecutionMode({
    type: "batchcall",
})
```
