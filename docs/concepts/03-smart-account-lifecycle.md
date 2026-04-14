# Smart Account Lifecycle

This document walks through the complete lifecycle of a smart account: from creation through first transaction and beyond.

## Step 1: Create an Owner

The owner is the key that controls the smart account. It signs UserOperations on behalf of the account. permissionless accepts three owner types:

```typescript
import { privateKeyToAccount } from "viem/accounts"
import { createWalletClient, http } from "viem"
import { sepolia } from "viem/chains"

// Option A: Private key (for scripts/backends)
const owner = privateKeyToAccount("0x...")

// Option B: Wallet client (for browser wallets)
const owner = createWalletClient({
    account: privateKeyToAccount("0x..."),
    chain: sepolia,
    transport: http(),
})

// Option C: EIP-1193 provider (e.g., window.ethereum)
const owner = window.ethereum
```

Internally, all owner types are normalized to a `LocalAccount` via `toOwner()`.

## Step 2: Create a Public Client

A viem public client is needed for on-chain reads (checking deployment status, reading nonce, computing counterfactual address):

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org"),
})
```

## Step 3: Create the Smart Account

The smart account factory computes the **counterfactual address** -- the address the account *will* have once deployed. No on-chain transaction is needed at this step.

```typescript
import { toSimpleSmartAccount } from "permissionless/accounts"

const account = await toSimpleSmartAccount({
    client: publicClient,
    owner,
    // Optional: specify EntryPoint version (defaults to 0.7)
    // entryPoint: { address: entryPoint07Address, version: "0.7" },
    // Optional: salt for deterministic address (defaults to 0n)
    // index: 0n,
})

console.log("Smart account address:", account.address)
// Works even before the account is deployed on-chain
```

What happens internally:
1. The owner's address is extracted
2. The factory address and factory calldata are computed (to deploy the account)
3. The counterfactual address is computed by simulating the factory call with `getSenderAddress`
4. A `SmartAccount` object is returned with all the methods needed to sign and encode UserOperations

## Step 4: Create the Smart Account Client

The `SmartAccountClient` wraps a bundler transport and the smart account, providing a high-level API:

```typescript
import { createSmartAccountClient } from "permissionless"
import { http } from "viem"
import { sepolia } from "viem/chains"

const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com"),
    // Optional: execution RPC for on-chain reads
    client: publicClient,
    // Optional: paymaster for gas sponsorship
    // paymaster: true,
})
```

The client automatically extends with `BundlerActions` (from viem) and `SmartAccountActions` (from permissionless).

## Step 5: First Transaction (Deploys the Account)

The first transaction from a new smart account includes factory data that deploys the account contract as part of the UserOperation:

```typescript
const txHash = await smartAccountClient.sendTransaction({
    to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    value: 0n,
    data: "0x",
})

console.log("Transaction hash:", txHash)
```

What happens behind the scenes:
1. `encodeCalls()` encodes the transaction as smart account calldata
2. `getNonce()` reads the nonce from the EntryPoint (0 for new accounts)
3. `getFactoryArgs()` returns `{ factory, factoryData }` since the account isn't deployed yet
4. Gas estimation is performed via `estimateUserOperationGas`
5. If a paymaster is configured, `getPaymasterData` fills in paymaster fields
6. `signUserOperation()` signs the complete UserOperation
7. `sendUserOperation()` submits to the bundler
8. The client polls `getUserOperationReceipt` until the UserOp is included in a block
9. Returns the transaction hash of the bundle transaction

## Step 6: Subsequent Transactions

After deployment, `getFactoryArgs()` returns `undefined`, so no factory data is included. The flow is otherwise identical:

```typescript
// No deployment -- just a regular UserOperation
const txHash2 = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 1000000000000000n, // 0.001 ETH
    data: "0x",
})
```

## Batch Transactions

Smart accounts can batch multiple calls into a single UserOperation:

```typescript
const txHash = await smartAccountClient.sendCalls({
    calls: [
        { to: "0xA...", value: 0n, data: "0x..." },
        { to: "0xB...", value: 0n, data: "0x..." },
        { to: "0xC...", value: 0n, data: "0x..." },
    ],
})

// Check status
const status = await smartAccountClient.getCallsStatus({
    id: txHash.id,
})
```

## Message Signing

Smart accounts can sign messages (EIP-191) and typed data (EIP-712):

```typescript
// EIP-191 message
const signature = await smartAccountClient.signMessage({
    message: "Hello, world!",
})

// EIP-712 typed data
const typedSignature = await smartAccountClient.signTypedData({
    domain: { name: "Example", version: "1", chainId: 11155111 },
    types: { Message: [{ name: "content", type: "string" }] },
    primaryType: "Message",
    message: { content: "Hello" },
})
```

Note: Not all account implementations support message signing. For example, `toSimpleSmartAccount` throws for `signMessage` and `signTypedData` because the SimpleAccount contract does not implement ERC-1271.

## With Paymaster (Gas Sponsorship)

To sponsor gas fees, configure a paymaster on the client:

```typescript
const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.pimlico.io/v2/..."),
    // The bundler also acts as paymaster
    paymaster: true,
})

// This transaction's gas is paid by the paymaster
const txHash = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 0n,
    data: "0x",
})
```

Or with a separate Pimlico client as paymaster:

```typescript
import { createPimlicoClient } from "permissionless/clients/pimlico"

const pimlicoClient = createPimlicoClient({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=..."),
})

const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=..."),
    paymaster: pimlicoClient,
})
```
