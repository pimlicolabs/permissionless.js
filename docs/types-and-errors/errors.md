# Errors

permissionless exports custom error classes that extend viem's `BaseError`.

## Import

```typescript
import { AccountNotFoundError } from "permissionless/errors"
// or
import { AccountNotFoundError } from "permissionless"

import { InvalidEntryPointError } from "permissionless/actions"
```

---

## `AccountNotFoundError`

Thrown when an action requires a smart account but none is found on the client or in the action parameters.

### Source

`errors/index.ts` -- extends `BaseError` from viem.

### Constructor

```typescript
new AccountNotFoundError({ docsPath?: string })
```

### Message

```
Could not find an Account to execute with this Action.
Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client.
```

### When It's Thrown

- Calling `sendTransaction`, `signMessage`, `signTypedData`, or `writeContract` on a client without an `account` set, and without passing `account` in the action parameters
- Any smart account action where no account can be resolved

### Example

```typescript
import { AccountNotFoundError } from "permissionless/errors"

try {
    await client.sendTransaction({ to: "0x...", value: 0n })
} catch (error) {
    if (error instanceof AccountNotFoundError) {
        console.error("No smart account configured on client")
    }
}
```

---

## `InvalidEntryPointError`

Thrown by `getSenderAddress` when the counterfactual address cannot be computed (e.g., invalid init code, wrong EntryPoint address).

### Source

`actions/public/getSenderAddress.ts` -- extends `BaseError` from viem.

### When It's Thrown

- `getSenderAddress()` simulation fails
- Invalid or incompatible init code / factory data
- Wrong EntryPoint address

### Example

```typescript
import { InvalidEntryPointError, getSenderAddress } from "permissionless/actions"

try {
    const address = await getSenderAddress(client, {
        factory: "0x...",
        factoryData: "0x...",
        entryPointAddress: "0xWrongEntryPoint...",
    })
} catch (error) {
    if (error instanceof InvalidEntryPointError) {
        console.error("Failed to compute sender address:", error.message)
    }
}
```
