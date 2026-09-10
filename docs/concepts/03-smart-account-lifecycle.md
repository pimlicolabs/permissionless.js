# Smart Account Lifecycle

This document walks through the lifecycle of a smart account: creation, the first transaction, and what follows.

## Step 1: Create an Owner

The owner is the key that controls the smart account and signs its UserOperations. Account constructors accept three owner types:

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"

// Option A: a local account (scripts, backends)
const owner = Account.fromPrivateKey("0x...")

// Option B: a viem client with an account (browser wallets)
const owner = Client.create({
    account: Account.fromPrivateKey("0x..."),
    chain: sepolia,
    transport: http()
})

// Option C: an EIP-1193 provider
const owner = window.ethereum
```

Internally every owner is normalised to an `Account.Local` with `Owner.from`. Safe additionally accepts WebAuthn accounts and address-only accounts.

## Step 2: Create a Public Client

A viem client for on-chain reads (deployment status, nonce, counterfactual address):

```typescript
import { Client, http } from "viem"
import { sepolia } from "viem/chains"

const publicClient = Client.create({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org")
})
```

## Step 3: Create the Smart Account

The constructor computes the **counterfactual address**, the address the account will have once deployed. No transaction is sent.

```typescript
import { SimpleSmartAccount } from "permissionless"

const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner
    // entryPoint: "0.7",   // Simple defaults to 0.8
    // index: 0n            // salt for the address
})

account.address // known before deployment
```

What happens internally:
1. The owner is normalised (`Owner.from`)
2. The factory address and factory calldata are computed
3. The counterfactual address is read by simulating the factory call (`getSenderAddress`)
4. viem's `SmartAccount.from` wraps the implementation into a `SmartAccount` with the signing and encoding methods

## Step 4: Create the Smart Account Client

`SmartAccountClient` wraps a bundler transport and the account:

```typescript
import { http } from "viem"
import { sepolia } from "viem/chains"
import { SmartAccountClient } from "permissionless"

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com"),
    client: publicClient
    // paymaster: true
})
```

The client is a viem `BundlerClient` (`userOperation.*` actions) extended with permissionless's `smartAccountActions`.

## Step 5: First Transaction (Deploys the Account)

The first UserOperation carries the factory data, so the account is deployed as part of it:

```typescript
const hash = await smartAccountClient.sendTransaction({
    to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    value: 0n,
    data: "0x"
})
```

Behind the scenes:
1. `encodeCalls()` encodes the call as account calldata
2. `getNonce()` reads the nonce from the EntryPoint (0 for a new account)
3. `getFactoryArgs()` returns `{ factory, factoryData }` because the account is not deployed
4. `userOperation.estimateGas` estimates gas with the stub signature (and stub paymaster data)
5. With a paymaster, `paymaster.getData` fills the paymaster fields
6. `signUserOperation()` signs the UserOperation
7. `userOperation.send` submits it to the bundler
8. `userOperation.waitForReceipt` polls until it is included
9. The transaction hash of the bundle transaction is returned

## Step 6: Subsequent Transactions

Once deployed, `getFactoryArgs()` returns `{ factory: undefined, factoryData: undefined }` and no factory data is included. Everything else is the same:

```typescript
const hash2 = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 1000000000000000n, // 0.001 ETH
    data: "0x"
})
```

## Batch Transactions

Several calls in a single UserOperation:

```typescript
const { id } = await smartAccountClient.sendCalls({
    calls: [
        { to: "0xA...", value: 0n, data: "0x..." },
        { to: "0xB...", value: 0n, data: "0x..." },
        { to: "0xC...", value: 0n, data: "0x..." }
    ]
})

const status = await smartAccountClient.getCallsStatus({ id })
```

## Message Signing

Accounts sign messages (EIP-191) and typed data (EIP-712) with their ERC-1271 scheme:

```typescript
const signature = await smartAccountClient.signMessage({
    message: "Hello, world!"
})

const typedSignature = await smartAccountClient.signTypedData({
    domain: { name: "Example", version: "1", chainId: 11155111 },
    types: { Message: [{ name: "content", type: "string" }] },
    primaryType: "Message",
    message: { content: "Hello" }
})
```

The signatures verify on-chain through `isValidSignature`, and before deployment through ERC-6492. `account.sign({ hash })` signs a raw digest the same way. SimpleAccount does not implement ERC-1271, so `SimpleSmartAccount` throws `SimpleAccountErc1271UnsupportedError` for all three.

## With Paymaster (Gas Sponsorship)

When the bundler URL also serves the `pm_*` methods:

```typescript
const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=..."),
    paymaster: true
})
```

Or with a `PimlicoClient` as the paymaster:

```typescript
import { PimlicoClient } from "permissionless/pimlico"

const pimlicoUrl = "https://api.pimlico.io/v2/sepolia/rpc?apikey=..."

const pimlicoClient = PimlicoClient.create({ transport: http(pimlicoUrl) })

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient
})
```
