---
"permissionless": major
---

`ThirdwebSmartAccount` is a namespace on viem 3, exported from the package root (`permissionless/accounts/thirdweb` is gone). Renames: `toThirdwebSmartAccount` → `ThirdwebSmartAccount.from`, `ToThirdwebSmartAccountParameters` → `ThirdwebSmartAccount.Parameters`, `ToThirdwebSmartAccountReturnType` → `ThirdwebSmartAccount.ReturnType`, `ThirdwebSmartAccountImplementation` → `ThirdwebSmartAccount.Implementation`. `entryPoint` is optional and accepts `"0.6" | "0.7"` or `{ address, version }` (default `"0.7"`); `version` is optional (default `"1.5.20"`). Both defaults are frozen for 1.x. The nonce key resolves per-call `key` first, constructor `nonceKey` second, `0n` last (0.x let `nonceKey` win and otherwise used viem's timestamp key). Removed: `THIRDWEB_ADDRESSES`, the unused `secp256k1VerificationFacetAddress` parameter. Empty `encodeCalls` throws the shared `EmptyCallsError`.

```ts
import { toThirdwebSmartAccount } from "permissionless/accounts" // [!code --]
import { ThirdwebSmartAccount } from "permissionless" // [!code ++]

const account = await toThirdwebSmartAccount({ // [!code --]
const account = await ThirdwebSmartAccount.from({ // [!code ++]
    client,
    owner,
    entryPoint: { address: entryPoint07Address, version: "0.7" }, // [!code --]
    version: "1.5.20" // [!code --]
})
```

`sign({ hash })` now produces a verifier-compatible ERC-1271 signature: the raw 32-byte hash goes through the account's replay-safe wrapper, so `client.verifyHash` accepts it (0.x signed the hash's hex string, which no verifier accepted).
