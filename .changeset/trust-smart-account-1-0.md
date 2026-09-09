---
"permissionless": major
---

`toTrustSmartAccount` is now `TrustSmartAccount.from`, exported from the package root (the `permissionless/accounts` and `permissionless/accounts/trust` subpaths are gone). `entryPoint` is optional and defaults to 0.6, the only EntryPoint version the account supports; pass `"0.6"` or `{ address, version: "0.6" }` to override the address. `ToTrustSmartAccountParameters`, `ToTrustSmartAccountReturnType` and `TrustSmartAccountImplementation` are now `TrustSmartAccount.Parameters`, `.ReturnType` and `.Implementation`. Failures throw the named `EmptyCallsError` and `TrustInvalidCallDataError` classes.

```ts
import { toTrustSmartAccount } from "permissionless/accounts" // [!code --]
import { entryPoint06Address } from "viem/account-abstraction" // [!code --]
import { TrustSmartAccount } from "permissionless" // [!code ++]

const account = await toTrustSmartAccount({ // [!code --]
const account = await TrustSmartAccount.from({ // [!code ++]
    client: publicClient,
    owner,
    entryPoint: { address: entryPoint06Address, version: "0.6" } // [!code --]
})
```
