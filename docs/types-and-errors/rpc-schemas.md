# RPC Schemas

RPC schemas define the JSON-RPC methods available for each provider client. They extend viem's typed RPC system.

## PimlicoRpcSchema

Defined in `types/pimlico.ts`. Used by `PimlicoClient`.

### Methods

| RPC Method | Parameters | Returns |
|-----------|-----------|---------|
| `pimlico_getUserOperationGasPrice` | `[]` | `{ slow, standard, fast }` with `{ maxFeePerGas, maxPriorityFeePerGas }` per tier |
| `pimlico_getUserOperationStatus` | `[Hash]` | `{ status: string, transactionHash: Hash \| null }` |
| `pimlico_sendCompressedUserOperation` | `[Hex, Address, Address]` | `Hash` |
| `pm_sponsorUserOperation` | `[UserOperation, Address, context?]` | Paymaster data (version-dependent) |
| `pm_validateSponsorshipPolicies` | `[UserOperation, Address, string[]]` | Policy validation results |
| `pimlico_getTokenQuotes` | `[{ tokens, ... }]` | Token quote data |

### Status Values for `pimlico_getUserOperationStatus`

| Status | Description |
|--------|-------------|
| `"not_found"` | UserOp not known to the bundler |
| `"not_submitted"` | Received but not yet submitted |
| `"submitted"` | Submitted to mempool |
| `"rejected"` | Rejected by bundler |
| `"reverted"` | Executed but reverted |
| `"included"` | Successfully included in a block |
| `"failed"` | Failed for other reasons |

---

## EtherspotBundlerRpcSchema

Defined in `types/etherspot.ts`. Used by Etherspot bundler clients.

### Methods

| RPC Method | Parameters | Returns |
|-----------|-----------|---------|
| `skandha_getGasPrice` | `[]` | `{ maxFeePerGas, maxPriorityFeePerGas }` |

---

## PasskeyServerRpcSchema

Defined in `types/passkeyServer.ts`. Used by `PasskeyServerClient`.

### Methods

| RPC Method | Parameters | Returns |
|-----------|-----------|---------|
| `pks_startRegistration` | `[{ userName }]` | WebAuthn creation options |
| `pks_verifyRegistration` | `[{ credential }]` | `{ success, id, publicKey, userName }` |
| `pks_getCredentials` | `[params]` | `{ id, publicKey }[]` |
| `pks_startAuthentication` | `[params]` | WebAuthn authentication options |
| `pks_verifyAuthentication` | `[params]` | `{ success, id, publicKey, userName }` |

## Usage with Custom Clients

RPC schemas enable TypeScript type checking for custom RPC calls:

```typescript
import type { PimlicoRpcSchema } from "permissionless/types/pimlico"

const client = createClient<Transport, Chain, Account, PimlicoRpcSchema>({
    transport: http(pimlicoUrl),
})

// TypeScript knows the return type
const result = await client.request({
    method: "pimlico_getUserOperationGasPrice",
})
// result is typed as { slow, standard, fast }
```
