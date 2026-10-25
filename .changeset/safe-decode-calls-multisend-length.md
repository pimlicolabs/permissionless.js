---
"permissionless": patch
---

Fix `decodeCalls` for Safe accounts when a batch (MultiSend) contains a call with non-empty data before the last call: the inner data length was multiplied by 2 before being used as a byte offset, so the first call's data absorbed the following bytes and every later call was mis-parsed.

Also fix related MultiSend decoding issues in Safe accounts:

- Batches whose last call has empty data (e.g. a plain ETH transfer) no longer throw.
- Batches are detected with a case-insensitive address comparison, so a non-checksummed `multiSendCallOnlyAddress` works.
- Batches are only unpacked for delegatecalls to MultiSendCallOnly. A regular call to that address decodes as a single call, and delegatecalls that `decodeCalls` can't represent now throw instead of being returned as regular calls.
- Truncated or malformed MultiSend data throws instead of decoding into shortened calls.
- Encoding a batch with odd-length hex call data throws a clear error.
