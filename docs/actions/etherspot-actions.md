# Etherspot Actions

Etherspot (Skandha) bundler actions. They live on the `Etherspot` namespace in `permissionless/etherspot`.

## Import

```typescript
import { Etherspot } from "permissionless/etherspot"
import type { Etherspot } from "permissionless/etherspot"
// Etherspot.GetUserOperationGasPriceReturnType, Etherspot.Schema
```

---

## `Etherspot.getUserOperationGasPrice`

Gets the gas price recommendation from the Skandha bundler.

**RPC method:** `skandha_getGasPrice`

### Signature

```typescript
async function Etherspot.getUserOperationGasPrice(
    client: Client
): Promise<Etherspot.GetUserOperationGasPriceReturnType>
```

### Returns

```typescript
{
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
}
```

### Example

```typescript
import { Client, http } from "viem"
import { Etherspot } from "permissionless/etherspot"

const client = Client.create({
    transport: http("https://skandha.etherspot.io/...")
})

const gasPrice = await Etherspot.getUserOperationGasPrice(client)
gasPrice.maxFeePerGas
```

## Migrating from 0.x

- The `actions/etherspot` subpath -> the `Etherspot` namespace in `permissionless/etherspot`.
- `GetGasPriceResponseReturnType` -> `Etherspot.GetUserOperationGasPriceReturnType`; the RPC schema type is `Etherspot.Schema`.
