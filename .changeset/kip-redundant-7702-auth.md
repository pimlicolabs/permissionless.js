---
"permissionless": patch
---

Skip adding `authorization` to `sendTransaction` when the account is already 7702-attached to the same address. 
This prevents redundant Type-4 overhead in UserOps and reduces calldata/gas; no changes required for consumers.
