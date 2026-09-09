---
"permissionless": major
---

`SimpleSmartAccount` namespace on viem 3 (`SimpleSmartAccount.from` replaces `toSimpleSmartAccount`).

**The default EntryPoint moves from 0.7 to 0.8.** Simple accounts created without an explicit `entryPoint` now derive a **different counterfactual address** than 0.x did. To keep addressing existing accounts, pin `entryPoint: "0.7"`:

```ts
import { toSimpleSmartAccount } from "permissionless/accounts" // [!code --]
import { SimpleSmartAccount } from "permissionless" // [!code ++]

const account = await toSimpleSmartAccount({ // [!code --]
const account = await SimpleSmartAccount.from({ // [!code ++]
    client: publicClient,
    owner,
    entryPoint: { address: entryPoint07Address, version: "0.7" }, // [!code --]
    entryPoint: "0.7", // [!code ++]
})
```

- `entryPoint` is optional and accepts the `"0.6" | "0.7" | "0.8" | "0.9"` shorthand or `{ address, version }`. EntryPoint 0.9 is supported; it has no default factory, so pass `factoryAddress` (a `SimpleAccountFactoryAddressRequiredError` is thrown otherwise).
- Nonce key precedence is now `args.key ?? nonceKey ?? 0n`: a per-call key passed to `account.getNonce({ key })` wins over the constructor `nonceKey`. 0.x preferred the constructor value.
- `to7702SimpleSmartAccount` and its types are removed. EIP-7702 mode is `eip7702: true` on `SimpleSmartAccount.from`; the account address is the owner EOA and `implementation` (was `accountLogicAddress`) selects the delegate.
- Types: `ToSimpleSmartAccountParameters` → `SimpleSmartAccount.Parameters`, `ToSimpleSmartAccountReturnType` → `SimpleSmartAccount.ReturnType`, `SimpleSmartAccountImplementation` → `SimpleSmartAccount.Implementation`. `To7702SimpleSmartAccount*` types are removed.
- Throw sites are named errors: `SimpleAccountErc1271UnsupportedError`, `SimpleAccountEmptyCallsError`, `SimpleAccountFactoryAddressRequiredError`.
