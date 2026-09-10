# RPC Schemas

Each provider client types its JSON-RPC methods with a viem `RpcSchema`. The schema types are exported as `Schema` on the client namespace (or, for Etherspot, the action namespace).

| Schema | Export | Used by |
|--------|--------|---------|
| Pimlico | `PimlicoClient.Schema<entryPointVersion>` (`permissionless/pimlico`) | `PimlicoClient.create`, `pimlicoActions` |
| Etherspot | `Etherspot.Schema` (`permissionless/etherspot`) | `Etherspot.getUserOperationGasPrice` |
| Passkey server | `PasskeyServerClient.Schema` (`permissionless/pimlico`) | `PasskeyServerClient.create` |

## `PimlicoClient.Schema`

Defined in `types/pimlico.ts`.

| RPC Method | Parameters | Returns |
|-----------|-----------|---------|
| `pimlico_getUserOperationGasPrice` | none | `{ slow, standard, fast }`, each `{ maxFeePerGas, maxPriorityFeePerGas }` |
| `pimlico_getUserOperationStatus` | `[hash]` | `{ status, transactionHash }` |
| `pm_sponsorUserOperation` | `[userOperation, entryPoint, { sponsorshipPolicyId? }?]` | Paymaster fields and gas limits; `paymasterAndData` on 0.6, `paymaster` + `paymasterData` + gas limits on 0.7+ |
| `pm_validateSponsorshipPolicies` | `[userOperation, entryPoint, sponsorshipPolicyIds]` | `{ sponsorshipPolicyId, data: { name, author, icon, description } }[]` |
| `pimlico_getTokenQuotes` | `[{ tokens }, entryPoint, chainId]` | `{ quotes: { paymaster, token, postOpGas, exchangeRate, exchangeRateNativeToUsd, balanceSlot?, allowanceSlot? }[] }` |

`pimlico_sendCompressedUserOperation` was removed in 1.0.

### Status values for `pimlico_getUserOperationStatus`

| Status | Description |
|--------|-------------|
| `"not_found"` | UserOperation not known to the bundler |
| `"not_submitted"` | Received but not yet submitted |
| `"submitted"` | Submitted to the mempool |
| `"rejected"` | Rejected by the bundler |
| `"reverted"` | Executed but reverted |
| `"included"` | Included in a block |
| `"failed"` | Failed for another reason |

---

## `Etherspot.Schema`

Defined in `types/etherspot.ts`.

| RPC Method | Parameters | Returns |
|-----------|-----------|---------|
| `skandha_getGasPrice` | none | `{ maxFeePerGas, maxPriorityFeePerGas }` |

---

## `PasskeyServerClient.Schema`

Defined in `types/passkeyServer.ts`.

| RPC Method | Parameters | Returns |
|-----------|-----------|---------|
| `pks_startRegistration` | `[context]` | WebAuthn creation options (`rp`, `user`, `challenge`, `attestation`, …) |
| `pks_verifyRegistration` | `[credential, context]` | `{ success, id, publicKey, userName }` |
| `pks_getCredentials` | `[context]` | `{ id, publicKey }[]` |
| `pks_startAuthentication` | none | `{ challenge, rpId, uuid, timeout?, userVerification? }` |
| `pks_verifyAuthentication` | `[credential, context]` | `{ success, id, publicKey, userName }` |

## Typed requests

The clients expose the typed `request` directly:

```typescript
const gasPrice = await pimlicoClient.request({
    method: "pimlico_getUserOperationGasPrice"
})
// { slow, standard, fast } with hex quantities
```

`SmartAccountClient.Config`, `PimlicoClient.Config` and `PasskeyServerClient.Config` take viem 3's `schema` option to add methods of your own.
