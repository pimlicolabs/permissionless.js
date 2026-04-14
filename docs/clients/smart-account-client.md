# SmartAccountClient

The `SmartAccountClient` is the primary client for sending transactions from a smart account via a bundler. It wraps a bundler transport and a smart account, providing a high-level API identical to viem's wallet client.

## Import

```typescript
import { createSmartAccountClient } from "permissionless"
// or
import { createSmartAccountClient, smartAccountActions } from "permissionless/clients"

import type {
    SmartAccountClient,
    SmartAccountClientConfig,
    SmartAccountActions,
} from "permissionless"
```

## `createSmartAccountClient`

```typescript
function createSmartAccountClient<
    transport extends Transport,
    chain extends Chain | undefined = undefined,
    account extends SmartAccount | undefined = undefined,
    client extends Client | undefined = undefined,
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: SmartAccountClientConfig<transport, chain, account, client, rpcSchema>
): SmartAccountClient<transport, chain, account, client, rpcSchema>
```

### Config Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bundlerTransport` | `Transport` | Yes | -- | Transport to the bundler RPC |
| `account` | `SmartAccount` | No | -- | Smart account to use |
| `chain` | `Chain` | No | Inferred from `client` | Chain for the client |
| `client` | `Client` | No | -- | Underlying execution RPC client (for on-chain reads) |
| `paymaster` | `true \| { getPaymasterData?, getPaymasterStubData? }` | No | -- | Paymaster configuration |
| `paymasterContext` | `unknown` | No | -- | Context passed to paymaster calls |
| `userOperation` | `{ estimateFeesPerGas?, prepareUserOperation? }` | No | -- | UserOperation customization hooks |
| `key` | `string` | No | `"bundler"` | Client identifier key |
| `name` | `string` | No | `"Bundler Client"` | Client display name |
| `cacheTime` | `number` | No | viem default | Cache duration in ms |
| `pollingInterval` | `number` | No | viem default | Polling interval in ms |
| `rpcSchema` | `RpcSchema` | No | -- | Additional RPC methods |

### `paymaster` Option

Three paymaster modes:

```typescript
// 1. No paymaster (user pays gas in ETH)
paymaster: undefined

// 2. Bundler acts as paymaster (same URL handles both)
paymaster: true

// 3. Custom paymaster functions
paymaster: {
    getPaymasterData: async (userOperation) => ({
        paymaster: "0x...",
        paymasterData: "0x...",
        paymasterVerificationGasLimit: 100000n,
        paymasterPostOpGasLimit: 50000n,
    }),
    getPaymasterStubData: async (userOperation) => ({
        paymaster: "0x...",
        paymasterData: "0x...",
        paymasterVerificationGasLimit: 100000n,
        paymasterPostOpGasLimit: 50000n,
    }),
}
```

### `userOperation` Hooks

```typescript
userOperation: {
    // Custom gas price estimation
    estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => ({
        maxFeePerGas: 30000000000n,
        maxPriorityFeePerGas: 1000000000n,
    }),
    // Custom UserOperation preparation (e.g., for ERC-20 paymaster)
    prepareUserOperation: async (client, parameters) => {
        // Modify UserOperation before signing
        return { ...parameters, /* modifications */ }
    },
}
```

### Return Type

`SmartAccountClient` is a viem `Client` with:
- **`BundlerActions`** -- `sendUserOperation`, `estimateUserOperationGas`, `getUserOperationByHash`, `getUserOperationReceipt`, `getSupportedEntryPoints`, `prepareUserOperation`, `waitForUserOperationReceipt`
- **`SmartAccountActions`** -- `sendTransaction`, `signMessage`, `signTypedData`, `writeContract`, `sendCalls`, `getCallsStatus`
- Extra properties: `client`, `paymaster`, `paymasterContext`, `userOperation`

## `smartAccountActions` Decorator

The decorator that adds smart account actions to any bundler client:

```typescript
import { smartAccountActions } from "permissionless/clients"

const client = createClient({ transport: http(bundlerUrl) })
    .extend(bundlerActions)
    .extend(smartAccountActions)
```

### Actions Added

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `sendTransaction` | `SendTransactionParameters` | `Hash` | Send transaction via UserOp |
| `signMessage` | `{ message }` | `Hex` | EIP-191 message signature |
| `signTypedData` | `{ domain, types, primaryType, message }` | `Hex` | EIP-712 typed data signature |
| `writeContract` | `WriteContractParameters` | `Hash` | Contract write via UserOp |
| `sendCalls` | `{ calls: { to, value, data }[] }` | `{ id: Hash }` | Batch calls via UserOp |
| `getCallsStatus` | `{ id: Hash }` | `GetCallsStatusReturnType` | Check batch call status |

## Examples

### Basic Usage

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toSimpleSmartAccount } from "permissionless/accounts"
import { createSmartAccountClient } from "permissionless"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org"),
})

const account = await toSimpleSmartAccount({
    client: publicClient,
    owner: privateKeyToAccount("0x..."),
})

const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com"),
    client: publicClient,
})

const hash = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 0n,
    data: "0x",
})
```

### With Pimlico Paymaster

```typescript
import { createPimlicoClient } from "permissionless/clients/pimlico"

const pimlicoClient = createPimlicoClient({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
})

const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
    paymaster: pimlicoClient,
})
```

### With Custom Gas Estimation

```typescript
const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http(bundlerUrl),
    userOperation: {
        estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
            return {
                maxFeePerGas: 50000000000n,
                maxPriorityFeePerGas: 2000000000n,
            }
        },
    },
})
```

## Internal Implementation

When `prepareUserOperation` is provided, the client applies a double `.extend(bundlerActions)` pattern to ensure the custom preparation hook overrides viem's default:

```typescript
client
    .extend(bundlerActions)
    .extend((client) => ({
        prepareUserOperation: (args) => customPrepareUserOp(client, args),
    }))
    .extend(bundlerActions)
    .extend((client) => ({
        prepareUserOperation: (args) => customPrepareUserOp(client, args),
    }))
    .extend(smartAccountActions)
```

Without `prepareUserOperation`, the simpler chain is used:
```typescript
client.extend(bundlerActions).extend(smartAccountActions)
```
