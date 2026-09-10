# Nonce Utilities

ERC-4337 uses a 2D nonce: a 192-bit `key` and a 64-bit `sequence`. The key selects a nonce lane, so UserOperations on different keys can be in flight at the same time.

## Import

```typescript
import { Nonce } from "permissionless"
```

---

## `Nonce.encode`

Packs a key and a sequence into a single `bigint`.

### Signature

```typescript
function Nonce.encode(args: { key: bigint; sequence: bigint }): bigint
```

### Formula

```
nonce = (key << 64) + sequence
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `bigint` | Yes | Nonce key (192 bits, selects the lane) |
| `sequence` | `bigint` | Yes | Sequence (64 bits, increments per operation) |

### Example

```typescript
Nonce.encode({ key: 0n, sequence: 0n }) // 0n
Nonce.encode({ key: 1n, sequence: 4n }) // 18446744073709551620n
```

---

## `Nonce.decode`

Unpacks a nonce into its key and sequence.

### Signature

```typescript
function Nonce.decode(nonce: bigint): { key: bigint; sequence: bigint }
```

### Example

```typescript
const { key, sequence } = Nonce.decode(18446744073709551620n)
// key: 1n, sequence: 4n
```

---

## Account nonce keys

Every account's `getNonce({ key })` resolves the key as the per-call `key`, then the constructor `nonceKey`, then `0n`, and reads the EntryPoint with `getAccountNonce`. Accounts with their own nonce layout (Kernel v0.3.x, Nexus, Etherspot) pack the key into their key field first; see the account pages for the limits.
