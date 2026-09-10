# PimlicoClient

`PimlicoClient` is a viem 3 `BundlerClient` against Pimlico's RPC with the Pimlico actions (gas price, sponsorship, policies, token quotes) and a `paymaster` decorator, so the same client can be passed as `paymaster` to `SmartAccountClient.create`.

## Import

```typescript
import { PimlicoClient, pimlicoActions } from "permissionless/pimlico"
import type { PimlicoClient } from "permissionless/pimlico"
// PimlicoClient.Client, PimlicoClient.Config, PimlicoClient.Schema
```

## `PimlicoClient.create`

```typescript
function PimlicoClient.create(
    parameters: PimlicoClient.Config
): PimlicoClient.Client
```

Generic over the EntryPoint version (default `"0.7"`), transport, chain, account and extra RPC schema.

### Config

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `transport` | `Transport.Transport` | Yes | -- | Transport to Pimlico's RPC |
| `entryPoint` | `{ address: Address, version: EntryPoint.Version }` | No | `{ address: EntryPoint.addressV07, version: "0.7" }` | EntryPoint the Pimlico actions target |
| `chain` | `Chain.Chain` | No | -- | Chain |
| `account` | `SmartAccount.SmartAccount` | No | -- | Account for the bundler actions |
| `key` | `string` | No | `"public"` | Client key |
| `name` | `string` | No | `"Pimlico Bundler Client"` | Client name |
| `cacheTime` | `number` | No | viem default | Cache duration |
| `pollingInterval` | `number` | No | viem default | Polling interval |
| `schema` | `RpcSchema.Generic` | No | -- | Extra typed RPC methods |

### Return Type

`PimlicoClient.Client` is a viem `BundlerClient.Client` with:

- viem's account-abstraction actions: `userOperation.prepare`, `userOperation.estimateGas`, `userOperation.send`, `userOperation.get`, `userOperation.getReceipt`, `userOperation.waitForReceipt`
- viem's paymaster decorator: `paymaster.getData`, `paymaster.getStubData` (`pm_getPaymasterData`, `pm_getPaymasterStubData`)
- `Pimlico.Actions`: `getUserOperationGasPrice`, `getUserOperationStatus`, `sponsorUserOperation`, `validateSponsorshipPolicies`, `getTokenQuotes`, `estimateErc20PaymasterCost` -- see [Pimlico Actions](../actions/pimlico-actions.md) and [ERC-20 Paymaster](../actions/erc20-paymaster.md)

Sending through `pimlicoClient.userOperation.send` does not sponsor by itself (no `pm_*` calls). To sponsor, pass the client as `paymaster` to `SmartAccountClient.create`.

### Internal Implementation

```typescript
Object.assign(
    BundlerClient.create({ ...rest, key, name }).extend(pimlicoActions({ entryPoint })),
    { paymaster: { getData, getStubData } }
)
```

## `pimlicoActions` Decorator

The factory that adds the Pimlico methods to any viem client:

```typescript
import { Client, http } from "viem"
import { EntryPoint } from "viem/erc4337"
import { pimlicoActions } from "permissionless/pimlico"

const client = Client.create({ transport: http(pimlicoUrl) }).extend(
    pimlicoActions({
        entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
    })
)
```

## Examples

### Basic Usage

```typescript
import { http } from "viem"
import { PimlicoClient } from "permissionless/pimlico"

const pimlicoClient = PimlicoClient.create({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY")
})

const gasPrice = await pimlicoClient.getUserOperationGasPrice()
gasPrice.standard.maxFeePerGas
```

### As Paymaster for SmartAccountClient

```typescript
import { SmartAccountClient } from "permissionless"

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
    paymaster: pimlicoClient
})
```

### With a Specific EntryPoint

```typescript
import { EntryPoint } from "viem/erc4337"

const pimlicoClient = PimlicoClient.create({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
    entryPoint: { address: EntryPoint.addressV06, version: "0.6" }
})
```
