---
"permissionless": patch
---

Fix ERC-1271 signatures for LightAccount 2.0.0: `signMessage` and `signTypedData` now sign the `LightAccountMessage` wrapper with EIP-712 domain version "2" (as reported by the contract's `eip712Domain()`), so `isValidSignature` returns the magic value instead of `0xffffffff`. LightAccount 1.1.0 keeps version "1".
