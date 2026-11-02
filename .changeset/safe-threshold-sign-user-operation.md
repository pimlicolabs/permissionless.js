---
"permissionless": patch
---

Fixed Safe `signUserOperation` returning an intermediate (ABI-encoded) signature instead of the final one when `threshold` is lower than the number of owners, which caused `AA24 signature error`. `signUserOperation` now accepts an optional `threshold` (defaults to `owners.length`), and `toSafeSmartAccount` only signs with `threshold` owners.
