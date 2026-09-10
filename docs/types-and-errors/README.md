# Types & Errors

This section documents the error classes and RPC schema types exported by permissionless.

## Type System Overview

permissionless builds on viem 3's namespaced types. The ones that appear throughout the API:

| Type | From | Description |
|------|------|-------------|
| `SmartAccount.SmartAccount` | `viem/erc4337` | What every `<X>SmartAccount.from` returns |
| `SmartAccount.Implementation` | `viem/erc4337` | Base of every `<X>SmartAccount.Implementation` |
| `UserOperation.UserOperation<version>` | `viem/erc4337` | Version-specific UserOperation |
| `EntryPoint.Version` | `viem/erc4337` | `"0.6" \| "0.7" \| "0.8" \| "0.9"` |
| `BundlerClient.Client` | `viem/erc4337` | Base of `SmartAccountClient.Client` and `PimlicoClient.Client` |
| `Client.Client`, `Transport.Transport`, `Chain.Chain` | `viem` | Core client primitives |
| `Account.Local`, `Account.Account` | `viem` | Owner types |
| `Address.Address`, `Hex.Hex` | `viem/utils` | Hex primitives |

Each permissionless namespace carries its own types: `<X>SmartAccount.Parameters` / `ReturnType` / `Implementation` (and `Version` where the account is versioned), `SmartAccountClient.Client` / `Config` / `Actions` / `PrepareUserOperationHook`, `PimlicoClient.Client` / `Config` / `Schema`, and `<Namespace>.<Action>Parameters` / `<Action>ReturnType` for every action. The [export map](../architecture/02-export-map.md) lists them all.

## Sections

- [Errors](./errors.md) -- every named error class, grouped by module
- [RPC Schemas](./rpc-schemas.md) -- `PimlicoClient.Schema`, `Etherspot.Schema`, `PasskeyServerClient.Schema`
