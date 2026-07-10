---
"permissionless": minor
---

Added support for dynamic (ERC-1271 contract) owners in toSafeSmartAccount. Owners can now be passed as `{ owner, dynamic: true }`, in which case their signatures are encoded as dynamic parts of the Safe signature bytes (contract signature format, signature type 0x00) and verified through EIP-1271 on the owner address.
