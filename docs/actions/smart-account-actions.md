# Smart Account Actions

Smart account actions convert high-level operations (send transaction, sign message) into UserOperations and submit them to a bundler.

These actions are automatically available on `SmartAccountClient` via the `smartAccountActions` decorator. They can also be imported standalone from `permissionless/actions/smartAccount`.

## Import

```typescript
import { sendTransaction, signMessage, signTypedData, writeContract } from "permissionless/actions/smartAccount"
```

---

## `sendTransaction`

Converts a standard transaction into a UserOperation, signs it, submits it to the bundler, and waits for inclusion.

### Signature

```typescript
async function sendTransaction(
    client: Client,
    args: SendTransactionParameters
): Promise<Hash>
```

### Parameters

Standard viem `SendTransactionParameters`:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | `Address` | Yes | Destination address |
| `value` | `bigint` | No | ETH value to send |
| `data` | `Hex` | No | Calldata |
| `account` | `SmartAccount` | No | Override client's account |

### Returns

`Hash` -- The transaction hash of the bundle transaction that included the UserOperation.

### Example

```typescript
const hash = await smartAccountClient.sendTransaction({
    to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    value: 1000000000000000n, // 0.001 ETH
    data: "0x",
})
```

---

## `sendCalls`

Sends multiple calls as a single UserOperation (batch execution).

### Signature

```typescript
async function sendCalls(
    client: Client,
    args: SendCallsParameters | SendUserOperationParameters
): Promise<{ id: Hash }>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `calls` | `{ to: Address, value?: bigint, data?: Hex }[]` | Yes | Array of calls to batch |
| `account` | `SmartAccount` | No | Override client's account |

### Returns

`{ id: Hash }` -- Object containing the UserOperation hash.

### Example

```typescript
const result = await smartAccountClient.sendCalls({
    calls: [
        { to: "0xA...", value: 0n, data: "0x..." },
        { to: "0xB...", value: 0n, data: "0x..." },
    ],
})

console.log("UserOp hash:", result.id)
```

---

## `getCallsStatus`

Checks the status of a previously sent batch of calls.

### Signature

```typescript
async function getCallsStatus(
    client: Client,
    args: { id: Hash }
): Promise<GetCallsStatusReturnType>
```

### Example

```typescript
const status = await smartAccountClient.getCallsStatus({
    id: result.id,
})
```

---

## `signMessage`

Signs an EIP-191 message using the smart account's signing logic.

### Signature

```typescript
async function signMessage(
    client: Client,
    args: { message: string | Uint8Array, account?: SmartAccount }
): Promise<Hex>
```

### Returns

`Hex` -- The ERC-1271 compatible signature.

### Example

```typescript
const signature = await smartAccountClient.signMessage({
    message: "Hello, world!",
})
```

> **Note:** Not all accounts support `signMessage`. Accounts without ERC-1271 support (e.g., SimpleSmartAccount) will throw an error.

---

## `signTypedData`

Signs EIP-712 typed data using the smart account's signing logic.

### Signature

```typescript
async function signTypedData(
    client: Client,
    args: {
        domain: TypedDataDomain
        types: TypedData
        primaryType: string
        message: Record<string, unknown>
        account?: SmartAccount
    }
): Promise<Hex>
```

### Returns

`Hex` -- The ERC-1271 compatible signature.

### Example

```typescript
const signature = await smartAccountClient.signTypedData({
    domain: {
        name: "Example",
        version: "1",
        chainId: 11155111,
    },
    types: {
        Message: [{ name: "content", type: "string" }],
    },
    primaryType: "Message",
    message: { content: "Hello" },
})
```

---

## `writeContract`

Encodes a contract function call and sends it as a UserOperation.

### Signature

```typescript
async function writeContract(
    client: Client,
    args: WriteContractParameters
): Promise<Hash>
```

### Parameters

Standard viem `WriteContractParameters`:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | `Address` | Yes | Contract address |
| `abi` | `Abi` | Yes | Contract ABI |
| `functionName` | `string` | Yes | Function to call |
| `args` | `any[]` | No | Function arguments |
| `value` | `bigint` | No | ETH to send |
| `account` | `SmartAccount` | No | Override client's account |

### Returns

`Hash` -- The transaction hash.

### Example

```typescript
const hash = await smartAccountClient.writeContract({
    address: "0xTokenContract...",
    abi: erc20Abi,
    functionName: "transfer",
    args: ["0xRecipient...", 1000000n],
})
```
