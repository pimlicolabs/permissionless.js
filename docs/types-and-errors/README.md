# Types & Errors

This section documents the error classes and RPC schema types exported by permissionless.

## Type System Overview

permissionless heavily re-exports and extends types from `viem` and `viem/account-abstraction`. The key viem types used throughout the library:

| Type | From | Description |
|------|------|-------------|
| `SmartAccount` | `viem/account-abstraction` | Interface for all smart accounts |
| `SmartAccountImplementation` | `viem/account-abstraction` | Implementation details type |
| `UserOperation<version>` | `viem/account-abstraction` | Version-specific UserOp type |
| `EntryPointVersion` | `viem/account-abstraction` | `"0.6" \| "0.7" \| "0.8"` |
| `Client` | `viem` | Base client type |
| `Transport` | `viem` | RPC transport |
| `Chain` | `viem` | Chain configuration |
| `Address` | `viem` | `0x${string}` |
| `Hex` | `viem` | `0x${string}` |
| `Hash` | `viem` | Transaction/UserOp hash |

## Sections

- [Errors](./errors.md) -- `AccountNotFoundError`, `InvalidEntryPointError`
- [RPC Schemas](./rpc-schemas.md) -- `PimlicoRpcSchema`, `EtherspotBundlerRpcSchema`, `PasskeyServerRpcSchema`
