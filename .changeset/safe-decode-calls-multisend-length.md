---
"permissionless": patch
---

Fix `decodeCalls` for Safe accounts when a batch (MultiSend) contains a call with non-empty data before the last call: the inner data length was multiplied by 2 before being used as a byte offset, so the first call's data absorbed the following bytes and every later call was mis-parsed.
