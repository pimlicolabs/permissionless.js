# Utilities

The `permissionless/utils` subpath exports utility functions organized into five categories.

## Import

```typescript
import { encodeNonce, decodeNonce, getRequiredPrefund } from "permissionless/utils"
// or from the root:
import { encodeNonce, decodeNonce, getRequiredPrefund } from "permissionless"
```

## Categories

| Category | Functions | Description |
|----------|-----------|-------------|
| [Nonce Utils](./nonce-utils.md) | `encodeNonce`, `decodeNonce` | 2D nonce encoding/decoding |
| [UserOperation Utils](./user-operation-utils.md) | `getPackedUserOperation`, `getRequiredPrefund`, `deepHexlify`, `transactionReceiptStatus` | UserOp packing, gas computation |
| [ERC-7579 Utils](./erc7579-utils.md) | `encode7579Calls`, `decode7579Calls`, `encodeInstallModule`, `encodeUninstallModule` | Module encoding/decoding |
| [ERC-20 Utils](./erc20-utils.md) | `erc20AllowanceOverride`, `erc20BalanceOverride` | State overrides for gas estimation |
| [Account Utils](./account-utils.md) | `isSmartAccountDeployed`, `toOwner`, `getAddressFromInitCodeOrPaymasterAndData` | Account helpers |

## Additional Exports

| Symbol | Description |
|--------|-------------|
| `getOxExports` | Get exports from optional `ox` module (for WebAuthn) |
| `hasOxModule` | Check if the `ox` package is installed |
