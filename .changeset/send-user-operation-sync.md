---
"permissionless": patch
---

Added `sendUserOperationSync` to `permissionless/actions/pimlico`. It prepares, signs and sends a user operation with `pimlico_sendUserOperationNow` and returns its receipt. If the outcome is unclear it polls for the receipt, and otherwise throws a `SendUserOperationSyncError` whose `kind` and `canResend` say what happened and whether resending is safe.
