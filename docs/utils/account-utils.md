# Account Utilities

Helper functions for working with smart accounts: deployment checks, owner normalization, and address extraction.

## Import

```typescript
import {
    isSmartAccountDeployed,
    toOwner,
    getAddressFromInitCodeOrPaymasterAndData,
} from "permissionless/utils"
```

---

## `isSmartAccountDeployed`

Checks if a smart account contract is deployed at the given address by calling `getCode`.

### Signature

```typescript
async function isSmartAccountDeployed(
    client: Client,
    address: Address
): Promise<boolean>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client` | `Client` | Yes | viem client for on-chain reads |
| `address` | `Address` | Yes | Smart account address to check |

### Returns

`boolean` -- `true` if bytecode exists at the address, `false` otherwise.

### Example

```typescript
import { isSmartAccountDeployed } from "permissionless/utils"

const deployed = await isSmartAccountDeployed(publicClient, "0x1234...")

if (!deployed) {
    console.log("Account not yet deployed -- first UserOp will deploy it")
}
```

---

## `toOwner`

Normalizes different owner types into a unified `LocalAccount`. Smart account factories call this internally to support multiple owner input types.

### Signature

```typescript
async function toOwner(args: {
    owner: EthereumProvider | WalletClient | LocalAccount,
    address?: Address,
}): Promise<LocalAccount>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner` | `EthereumProvider \| WalletClient \| LocalAccount` | Yes | Owner in any supported format |
| `address` | `Address` | No | Override the account address |

### Supported Owner Types

| Input Type | Conversion |
|-----------|------------|
| `LocalAccount` | Returned as-is |
| `WalletClient` | Extracts the account, converts to local signing |
| `EthereumProvider` (EIP-1193) | Creates a JSON-RPC account from `eth_requestAccounts` |

### Example

```typescript
import { toOwner } from "permissionless/utils"

// From a private key account (no-op, returned as-is)
const owner1 = await toOwner({ owner: privateKeyToAccount("0x...") })

// From a wallet client
const owner2 = await toOwner({ owner: walletClient })

// From an EIP-1193 provider
const owner3 = await toOwner({ owner: window.ethereum })
```

---

## `getAddressFromInitCodeOrPaymasterAndData`

Extracts the first 20 bytes (an address) from packed init code or paymaster data. In EntryPoint 0.6, the factory address and paymaster address are the first 20 bytes of the combined `initCode` and `paymasterAndData` fields respectively.

### Signature

```typescript
function getAddressFromInitCodeOrPaymasterAndData(data: Hex): Address
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | `Hex` | Yes | Packed data (initCode or paymasterAndData) |

### Returns

`Address` -- The first 20 bytes interpreted as an address.

### Example

```typescript
import { getAddressFromInitCodeOrPaymasterAndData } from "permissionless/utils"

// Extract factory address from EntryPoint 0.6 initCode
const factoryAddress = getAddressFromInitCodeOrPaymasterAndData(
    "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985abcdef..."
)
// => "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985"
```
