# PimlicoClient

The `PimlicoClient` provides access to Pimlico's bundler and paymaster APIs, including gas price estimation, UserOperation sponsorship, and ERC-20 paymaster token quotes.

## Import

```typescript
import { createPimlicoClient } from "permissionless/clients/pimlico"
import type { PimlicoClient, PimlicoClientConfig } from "permissionless/clients/pimlico"
```

## `createPimlicoClient`

```typescript
function createPimlicoClient<
    entryPointVersion extends EntryPointVersion = "0.7",
    transport extends Transport = Transport,
    chain extends Chain | undefined = undefined,
    account extends SmartAccount | undefined = SmartAccount | undefined,
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: PimlicoClientConfig<entryPointVersion, transport, chain, account, rpcSchema>
): PimlicoClient<entryPointVersion, transport, chain, account, client, rpcSchema>
```

### Config Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `transport` | `Transport` | Yes | -- | Transport to Pimlico's RPC |
| `entryPoint` | `{ address: Address, version: EntryPointVersion }` | No | `{ address: entryPoint07Address, version: "0.7" }` | EntryPoint configuration |
| `chain` | `Chain` | No | -- | Chain |
| `account` | `SmartAccount` | No | -- | Optional account |
| `key` | `string` | No | `"public"` | Client key |
| `name` | `string` | No | `"Pimlico Bundler Client"` | Client name |
| `cacheTime` | `number` | No | viem default | Cache duration |
| `pollingInterval` | `number` | No | viem default | Polling interval |
| `rpcSchema` | `RpcSchema` | No | -- | Additional RPC methods |

### Return Type

`PimlicoClient` is a viem `Client` with:
- **`BundlerActions`** -- All standard bundler methods
- **`PaymasterActions`** -- `getPaymasterData`, `getPaymasterStubData`
- **`PimlicoActions`** -- See [Pimlico Actions](../actions/pimlico-actions.md)

### Internal Implementation

```typescript
createClient({ ...parameters })
    .extend(bundlerActions)
    .extend(paymasterActions)
    .extend(pimlicoActions({ entryPoint }))
```

## `pimlicoActions` Decorator

The decorator factory that adds Pimlico-specific methods:

```typescript
import { pimlicoActions } from "permissionless/actions/pimlico"

const decorator = pimlicoActions({
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})
```

See [Pimlico Actions](../actions/pimlico-actions.md) for all available methods.

## Examples

### Basic Usage

```typescript
import { http } from "viem"
import { createPimlicoClient } from "permissionless/clients/pimlico"

const pimlicoClient = createPimlicoClient({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
})

// Get gas price recommendations
const gasPrice = await pimlicoClient.getUserOperationGasPrice()
console.log(gasPrice.standard.maxFeePerGas)
```

### As Paymaster for SmartAccountClient

```typescript
import { createSmartAccountClient } from "permissionless"

const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
    paymaster: pimlicoClient,
})
```

### With Specific EntryPoint

```typescript
import { entryPoint07Address } from "viem/account-abstraction"

const pimlicoClient = createPimlicoClient({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})
```
