---
"permissionless": major
---

`toEtherspotSmartAccount` is now `EtherspotSmartAccount.from`, imported from the package root. The `permissionless/accounts` and `permissionless/accounts/etherspot` subpaths are gone.

```ts
import { toEtherspotSmartAccount } from "permissionless/accounts"
import { entryPoint07Address } from "viem/account-abstraction"

const account = await toEtherspotSmartAccount({
    client: publicClient,
    owners: [owner],
    entryPoint: { address: entryPoint07Address, version: "0.7" }
})
```

becomes

```ts
import { EtherspotSmartAccount } from "permissionless"

const account = await EtherspotSmartAccount.from({
    client: publicClient,
    owner
})
```

- `owners: [owner]` is now `owner`.
- `entryPoint` is optional and typed 0.7-only: pass `"0.7"` or `{ address, version: "0.7" }`. 0.x typed `"0.6" | "0.7"` but always built a 0.7 account. Counterfactual addresses are unchanged.
- Per-call nonce keys are honoured. `getNonce({ key })` wins over the constructor `nonceKey`, which wins over `0n`; 0.x ignored the per-call key. Keys above `65535` (the 2-byte user key field) throw `EtherspotNonceKeyOverflowError`.
- Types: `ToEtherspotSmartAccountParameters` → `EtherspotSmartAccount.Parameters`, `ToEtherspotSmartAccountReturnType` → `EtherspotSmartAccount.ReturnType`, `EtherspotSmartAccountImplementation` → `EtherspotSmartAccount.Implementation`.
