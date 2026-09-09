---
"permissionless": major
---

`toNexusSmartAccount` is now `NexusSmartAccount.from`, exported from the package root and built on viem 3's `SmartAccount.from`.

```ts
import { toNexusSmartAccount } from "permissionless/accounts" // [!code --]
import { NexusSmartAccount } from "permissionless" // [!code ++]

const account = await toNexusSmartAccount({ // [!code --]
    client: publicClient, // [!code --]
    owners: [owner], // [!code --]
    version: "1.0.0", // [!code --]
    entryPoint: { address: entryPoint07Address, version: "0.7" }, // [!code --]
}) // [!code --]
const account = await NexusSmartAccount.from({ // [!code ++]
    client: publicClient, // [!code ++]
    owner, // [!code ++]
}) // [!code ++]
```

- `owner` is singular; the `owners: [owner]` tuple is gone.
- `entryPoint` is optional and also accepts the `"0.7"` shorthand. Nexus supports EntryPoint 0.7 only; the default is 0.7.
- `version` is optional and defaults to `"1.0.0"`.
- New `nonceKey` parameter. The nonce key resolves as per-call `key`, then `nonceKey`, then `0n`; 0.x used viem's timestamp-derived key when no per-call key was given.
- Attesters are sorted byte-wise before encoding, as in 0.4.0. Counterfactual addresses are unchanged.
- Types: `ToNexusSmartAccountParameters` → `NexusSmartAccount.Parameters`, `ToNexusSmartAccountReturnType` → `NexusSmartAccount.ReturnType`, `NexusSmartAccountImplementation` → `NexusSmartAccount.Implementation`; new `NexusSmartAccount.Version`.
- The `permissionless/accounts/nexus` subpath is removed.
