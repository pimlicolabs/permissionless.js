# Etherspot Actions

Etherspot-specific bundler actions for gas price estimation.

## Import

```typescript
import { getUserOperationGasPrice } from "permissionless/actions/etherspot"
import type { GetGasPriceResponseReturnType } from "permissionless/actions/etherspot"
```

---

## `getUserOperationGasPrice`

Gets gas price recommendations from the Etherspot (Skandha) bundler.

**RPC method:** `skandha_getGasPrice`

### Signature

```typescript
async function getUserOperationGasPrice(
    client: Client
): Promise<GetGasPriceResponseReturnType>
```

### Returns

```typescript
{
    maxFeePerGas: bigint,
    maxPriorityFeePerGas: bigint,
}
```

### Example

```typescript
import { createClient, http } from "viem"
import { getUserOperationGasPrice } from "permissionless/actions/etherspot"

const client = createClient({
    transport: http("https://skandha.etherspot.io/..."),
})

const gasPrice = await getUserOperationGasPrice(client)
console.log("Max fee:", gasPrice.maxFeePerGas)
```
