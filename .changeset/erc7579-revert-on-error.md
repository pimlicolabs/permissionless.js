---
"permissionless": minor
---

Fixed `revertOnError` in the ERC-7579 `ExecutionMode` (used by `encode7579Calls`, `decode7579Calls` and `supportsExecutionMode`) mapping to the wrong execType byte. `revertOnError: true` (and leaving it out) now encodes `0x00` (`EXECTYPE_DEFAULT`, a failed call reverts the whole execution), and `revertOnError: false` encodes `0x01` (`EXECTYPE_TRY`). The built-in accounts still send `0x00`.

Breaking: if you passed `revertOnError` explicitly, the byte it produces is flipped. `revertOnError: true` used to give try mode, so a failing call was swallowed. If you relied on try mode, pass `revertOnError: false`. `decode7579Calls` now returns `revertOnError: true` for `0x00` and `false` for `0x01`.
