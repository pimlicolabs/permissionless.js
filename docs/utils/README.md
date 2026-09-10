# Utilities

The 0.x `utils` subpath is gone. The helpers that stayed public live on namespaces exported from the package root or from `permissionless/pimlico`.

## Import

```typescript
import { Nonce, Owner, Erc7579, getRequiredPrefund } from "permissionless"
import { Erc20Paymaster } from "permissionless/pimlico"
```

## Categories

| Category | Symbols | Description |
|----------|---------|-------------|
| [Nonce Utils](./nonce-utils.md) | `Nonce.encode`, `Nonce.decode` | 2D nonce encoding/decoding |
| [UserOperation Utils](./user-operation-utils.md) | `getRequiredPrefund` | Minimum prefund for a UserOperation |
| [ERC-7579 Utils](./erc7579-utils.md) | `Erc7579.encodeCalls`, `Erc7579.decodeCalls`, `Erc7579.encodeInstallModule`, `Erc7579.encodeUninstallModule` | Execution and module calldata |
| [ERC-20 Utils](./erc20-utils.md) | `Erc20Paymaster.balanceOverride`, `Erc20Paymaster.allowanceOverride` | State overrides for gas estimation |
| [Account Utils](./account-utils.md) | `Owner.from` | Owner normalisation |

## Removed in 1.0

`getPackedUserOperation`, `deepHexlify`, `transactionReceiptStatus`, `isSmartAccountDeployed`, `getAddressFromInitCodeOrPaymasterAndData`, `getOxExports` and `hasOxModule` are no longer exported. viem 3's `UserOperation` namespace (`viem/erc4337`) covers hashing (`UserOperation.hash`) and EIP-712 typed data (`UserOperation.toTypedData`); `account.isDeployed()` replaces the deployment check; ox ships inside viem 3 (`viem/utils`).
