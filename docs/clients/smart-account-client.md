# SmartAccountClient

`SmartAccountClient` wraps a bundler transport and a smart account. It is a viem 3 `BundlerClient` with permissionless's smart-account actions (`sendTransaction`, `sendCalls`, `signMessage`, …) on top, so it reads like a wallet client.

## Import

```typescript
import { SmartAccountClient, smartAccountActions } from "permissionless"
import type { SmartAccountClient } from "permissionless"
// SmartAccountClient.Client, SmartAccountClient.Config, SmartAccountClient.Actions,
// SmartAccountClient.PrepareUserOperationHook
```

## `SmartAccountClient.create`

```typescript
function SmartAccountClient.create(
    parameters: SmartAccountClient.Config
): SmartAccountClient.Client
```

Generic over the transport, chain, account, execution client and extra RPC schema; all five are inferred from `parameters`.

### Config

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bundlerTransport` | `Transport.Transport` | Yes | -- | Transport to the bundler RPC |
| `account` | `SmartAccount.SmartAccount` | No | -- | Smart account to send from |
| `chain` | `Chain.Chain` | No | Inferred from `client` | Chain |
| `client` | `Client.Client` | No | -- | Execution RPC client for on-chain reads |
| `paymaster` | `true \| PaymasterClient.Client \| PimlicoClient.Client \| { getData?, getStubData? }` | No | -- | Paymaster (see below) |
| `paymasterContext` | `unknown` | No | -- | Context passed to the paymaster calls |
| `userOperation.estimateFeesPerGas` | `({ account, bundlerClient, userOperation }) => Promise<{ maxFeePerGas, maxPriorityFeePerGas }>` | No | viem default | Fee estimation hook |
| `userOperation.prepareUserOperation` | `SmartAccountClient.PrepareUserOperationHook` | No | -- | Replaces `userOperation.prepare` (see below) |
| `key` | `string` | No | `"bundler"` | Client key |
| `name` | `string` | No | `"Bundler Client"` | Client name |
| `cacheTime` | `number` | No | viem default | Cache duration in ms |
| `pollingInterval` | `number` | No | viem default | Polling interval in ms |
| `schema` | `RpcSchema.Generic` | No | -- | Extra typed RPC methods |

### `paymaster` Option

```typescript
// 1. No paymaster: the account pays gas in ETH
paymaster: undefined

// 2. The bundler URL also serves pm_* methods
paymaster: true

// 3. A paymaster client (PimlicoClient.create or viem's PaymasterClient.create)
paymaster: pimlicoClient

// 4. Custom functions
paymaster: {
    getData: async (userOperation) => ({
        paymaster: "0x...",
        paymasterData: "0x...",
        paymasterVerificationGasLimit: 100000n,
        paymasterPostOpGasLimit: 50000n
    }),
    getStubData: async (userOperation) => ({
        paymaster: "0x...",
        paymasterData: "0x...",
        paymasterVerificationGasLimit: 100000n,
        paymasterPostOpGasLimit: 50000n
    })
}
```

### `userOperation` Hooks

```typescript
userOperation: {
    estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => ({
        maxFeePerGas: 30000000000n,
        maxPriorityFeePerGas: 1000000000n
    }),
    prepareUserOperation: Erc20Paymaster.prepareUserOperation(pimlicoClient)
}
```

`PrepareUserOperationHook` is `(client: BundlerClient.Client, parameters: Actions.userOperation.prepare.Options) => Promise<Actions.userOperation.prepare.ReturnType>` (`Actions` from `viem/erc4337`). When set, the client's `userOperation.prepare` and `userOperation.send` run through it before signing. `Erc20Paymaster.prepareUserOperation` from `permissionless/pimlico` is the shipped hook.

### Return Type

`SmartAccountClient.Client` is a viem `BundlerClient.Client` with:

- viem's account-abstraction actions: `userOperation.prepare`, `userOperation.estimateGas`, `userOperation.send`, `userOperation.get`, `userOperation.getReceipt`, `userOperation.waitForReceipt`
- `SmartAccountClient.Actions`: `sendTransaction`, `sendCalls`, `getCallsStatus`, `signMessage`, `signTypedData`, `writeContract`
- properties `account`, `client`, `paymaster`, `paymasterContext`

## `smartAccountActions` Decorator

Adds the smart-account actions to any viem bundler client:

```typescript
import { http } from "viem"
import { BundlerClient } from "viem/erc4337"
import { smartAccountActions } from "permissionless"

const client = BundlerClient.create({ account, transport: http(bundlerUrl) })
    .extend(smartAccountActions)
```

### Actions Added

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `sendTransaction` | `{ to, value?, data?, account?, authorization? }` | `Hash` | Send one call as a UserOperation, wait for inclusion |
| `sendCalls` | `{ calls: { to, value?, data? }[], account? }` | `{ id: Hash }` | Send a batch as a UserOperation |
| `getCallsStatus` | `{ id: Hash }` | `GetCallsStatusReturnType` | Status of a batch (`receipts: []` while pending) |
| `signMessage` | `{ message }` | `Hex` | EIP-191 message signature via the account's ERC-1271 scheme |
| `signTypedData` | `{ domain, types, primaryType, message }` | `Hex` | EIP-712 typed data signature via the account's ERC-1271 scheme |
| `writeContract` | `{ address, abi, functionName, args, value? }` | `Hash` | Contract write as a UserOperation |

See [Smart Account Actions](../actions/smart-account-actions.md).

## Examples

### Basic Usage

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { SimpleSmartAccount, SmartAccountClient } from "permissionless"

const publicClient = Client.create({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org")
})

const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner: Account.fromPrivateKey("0x...")
})

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com"),
    client: publicClient
})

const hash = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 0n,
    data: "0x"
})
```

### With Pimlico Paymaster

```typescript
import { PimlicoClient } from "permissionless/pimlico"

const pimlicoUrl = "https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"

const pimlicoClient = PimlicoClient.create({ transport: http(pimlicoUrl) })

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient
})
```

### With Custom Fee Estimation

```typescript
const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    userOperation: {
        estimateFeesPerGas: async () =>
            (await pimlicoClient.getUserOperationGasPrice()).fast
    }
})
```

## Internal Implementation

`create` builds a viem `BundlerClient` from the config (`transport: bundlerTransport`, `paymaster`, `userOperation.estimateFeesPerGas`). Without `prepareUserOperation` it extends that client with `smartAccountActions`. With the hook it first overrides `userOperation.prepare` (delegating to the hook) and `userOperation.send` (hook, then viem's `userOperation.send` with the prepared request), then applies `smartAccountActions`.
