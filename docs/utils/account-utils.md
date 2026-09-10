# Account Utilities

## Import

```typescript
import { Owner } from "permissionless"
```

---

## `Owner.from`

Normalises the owner types every account constructor accepts into a viem `Account.Local`. Account constructors call it internally.

### Signature

```typescript
async function Owner.from(args: {
    owner: EthereumProvider | WalletClient | Account.Local
    address?: Address
}): Promise<Account.Local>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner` | `Account.Local \| WalletClient \| EthereumProvider` | Yes | Owner in any supported form |
| `address` | `Address` | No | Account to use for a provider owner (skips `eth_requestAccounts`) |

### Supported Owner Types

| Input | Result |
|-------|--------|
| `Account.Local` | Returned as-is |
| Wallet client (`Client.Client<Chain, Account>`) | Wrapped: `signMessage` and `signTypedData` go through the client; `sign` (raw hash) throws `OwnerSignUnsupportedError` |
| `EthereumProvider` (an object with an EIP-1193 `request`) | The address comes from `eth_requestAccounts` (falling back to `eth_accounts`) unless `address` is given, then wrapped like a wallet client |

### Errors

- `OwnerAddressRequiredError` -- the provider returned no accounts and `address` was not given
- `OwnerSignUnsupportedError` -- `sign` on a wallet-client or provider owner (they cannot sign raw hashes)

### Example

```typescript
import { Account } from "viem"
import { Owner } from "permissionless"

const owner1 = await Owner.from({ owner: Account.fromPrivateKey("0x...") })
const owner2 = await Owner.from({ owner: walletClient })
const owner3 = await Owner.from({ owner: window.ethereum })
```

---

## Removed in 1.0

- `isSmartAccountDeployed` -- use `account.isDeployed()` on any viem `SmartAccount`.
- `getAddressFromInitCodeOrPaymasterAndData` -- the first 20 bytes of an EntryPoint 0.6 `initCode` / `paymasterAndData` are the factory / paymaster address; slice them yourself.
- `toOwner` -- renamed to `Owner.from`.
