---
"permissionless": major
---

**Light Account: `toLightSmartAccount` → `LightSmartAccount.from`.** The account is now a namespace exported from the package root; the `permissionless/accounts` subpath is gone.

```ts
import { toLightSmartAccount } from "permissionless/accounts" // [!code --]
import { LightSmartAccount } from "permissionless" // [!code ++]
import { entryPoint07Address } from "viem/account-abstraction" // [!code --]

const account = await toLightSmartAccount({ // [!code --]
    client: publicClient, // [!code --]
    owner, // [!code --]
    entryPoint: { address: entryPoint07Address, version: "0.7" }, // [!code --]
    version: "2.0.0", // [!code --]
}) // [!code --]
const account = await LightSmartAccount.from({ // [!code ++]
    client: publicClient, // [!code ++]
    owner, // [!code ++]
    entryPoint: "0.7", // optional — "0.6" | "0.7" or { address, version } // [!code ++]
    version: "2.0.0", // optional — 2.0.0 for EntryPoint 0.7, 1.1.0 for 0.6 // [!code ++]
}) // [!code ++]
```

- `entryPoint` is optional and accepts a version shorthand; it defaults to `0.7`.
- `version` is optional; it defaults to the version the EntryPoint supports (`2.0.0` for 0.7, `1.1.0` for 0.6). Passing the other version throws `LightSmartAccountUnsupportedVersionError`.
- Nonce keys resolve as per-call `key`, then the constructor `nonceKey`, then `0n` (0.x let the constructor value win).
- Types moved into the namespace: `ToLightSmartAccountParameters` → `LightSmartAccount.Parameters`, `ToLightSmartAccountReturnType` → `LightSmartAccount.ReturnType`, `LightSmartAccountImplementation` → `LightSmartAccount.Implementation`, `LightAccountVersion` → `LightSmartAccount.Version`.
- `encodeCalls([])` throws `LightSmartAccountEmptyCallsError` instead of a plain `Error`.
- Counterfactual addresses are unchanged for every explicit `entryPoint` + `version` pair.
