# Nonce Utilities

ERC-4337 uses a 2D nonce system with a `key` (192 bits) and `sequence` (64 bits). The key enables parallel nonce lanes, allowing multiple UserOperations to be in-flight simultaneously without blocking each other.

## Import

```typescript
import { encodeNonce, decodeNonce } from "permissionless/utils"
```

---

## `encodeNonce`

Packs a nonce key and sequence into a single `bigint` nonce value.

### Signature

```typescript
function encodeNonce(args: { key: bigint, sequence: bigint }): bigint
```

### Formula

```
nonce = (key << 64) + sequence
```

The key occupies the upper 192 bits and the sequence occupies the lower 64 bits.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `bigint` | Yes | Nonce key (192 bits, identifies the nonce lane) |
| `sequence` | `bigint` | Yes | Nonce sequence (64 bits, increments per operation) |

### Returns

`bigint` -- The packed nonce value.

### Example

```typescript
import { encodeNonce } from "permissionless/utils"

// Default lane (key=0), first operation
const nonce0 = encodeNonce({ key: 0n, sequence: 0n })
// => 0n

// Lane 1, fifth operation
const nonce1 = encodeNonce({ key: 1n, sequence: 4n })
// => 18446744073709551620n (1 << 64 + 4)

// Parallel lanes for concurrent UserOperations
const lane0 = encodeNonce({ key: 0n, sequence: 5n })
const lane1 = encodeNonce({ key: 1n, sequence: 0n })
const lane2 = encodeNonce({ key: 2n, sequence: 0n })
```

---

## `decodeNonce`

Unpacks a nonce `bigint` into its key and sequence components.

### Signature

```typescript
function decodeNonce(nonce: bigint): { key: bigint, sequence: bigint }
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nonce` | `bigint` | Yes | Packed nonce value |

### Returns

```typescript
{ key: bigint, sequence: bigint }
```

### Example

```typescript
import { decodeNonce } from "permissionless/utils"

const { key, sequence } = decodeNonce(18446744073709551620n)
// key: 1n
// sequence: 4n
```
