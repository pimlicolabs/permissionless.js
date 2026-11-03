---
"permissionless": patch
---

Fixed `encode7579Calls` and `decode7579Calls` for `delegatecall` mode: the execution data is `target ++ callData` with no value word, so Kernel's validator migration call reaches `migrateWithCall`.
