# Pimlico Actions

Pimlico-specific actions for interacting with Pimlico's bundler and paymaster APIs.

## Import

```typescript
import {
    pimlicoActions,
    getUserOperationGasPrice,
    getUserOperationStatus,
    sponsorUserOperation,
    validateSponsorshipPolicies,
    getTokenQuotes,
    sendCompressedUserOperation,
} from "permissionless/actions/pimlico"
```

## `pimlicoActions` Decorator

Factory that creates a decorator adding all Pimlico methods to a client:

```typescript
const decorator = pimlicoActions({
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})

const client = createClient({ transport: http(pimlicoUrl) })
    .extend(decorator)
```

---

## `getUserOperationGasPrice`

Gets gas price recommendations from Pimlico at three speed tiers.

**RPC method:** `pimlico_getUserOperationGasPrice`

### Signature

```typescript
async function getUserOperationGasPrice(
    client: Client
): Promise<GetUserOperationGasPriceReturnType>
```

### Returns

```typescript
{
    slow: { maxFeePerGas: bigint, maxPriorityFeePerGas: bigint },
    standard: { maxFeePerGas: bigint, maxPriorityFeePerGas: bigint },
    fast: { maxFeePerGas: bigint, maxPriorityFeePerGas: bigint },
}
```

### Example

```typescript
const gasPrice = await pimlicoClient.getUserOperationGasPrice()
console.log("Standard gas price:", gasPrice.standard.maxFeePerGas)
```

---

## `getUserOperationStatus`

Checks the current status of a submitted UserOperation.

**RPC method:** `pimlico_getUserOperationStatus`

### Signature

```typescript
async function getUserOperationStatus(
    client: Client,
    args: GetUserOperationStatusParameters
): Promise<GetUserOperationStatusReturnType>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hash` | `Hash` | Yes | UserOperation hash |

### Returns

```typescript
{
    status: "not_found" | "not_submitted" | "submitted" | "rejected" | "reverted" | "included" | "failed",
    transactionHash: Hash | null,
}
```

### Example

```typescript
const status = await pimlicoClient.getUserOperationStatus({
    hash: "0x...",
})

if (status.status === "included") {
    console.log("Included in tx:", status.transactionHash)
}
```

---

## `sponsorUserOperation`

Requests Pimlico to sponsor a UserOperation (pay its gas fees).

**RPC method:** `pm_sponsorUserOperation`

### Signature

```typescript
async function sponsorUserOperation(
    client: Client,
    args: PimlicoSponsorUserOperationParameters
): Promise<SponsorUserOperationReturnType>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation` | Yes | The UserOperation to sponsor |
| `entryPoint` | `Address` | Yes | EntryPoint address |
| `sponsorshipPolicyId` | `string` | No | Specific policy to use |

### Returns

For EntryPoint 0.7/0.8:
```typescript
{
    paymaster: Address,
    paymasterData: Hex,
    paymasterVerificationGasLimit: bigint,
    paymasterPostOpGasLimit: bigint,
    callGasLimit: bigint,
    verificationGasLimit: bigint,
    preVerificationGas: bigint,
}
```

For EntryPoint 0.6:
```typescript
{
    paymasterAndData: Hex,
    callGasLimit: bigint,
    verificationGasLimit: bigint,
    preVerificationGas: bigint,
}
```

### Example

```typescript
const sponsorship = await pimlicoClient.sponsorUserOperation({
    userOperation,
    entryPoint: entryPoint07Address,
})
```

---

## `validateSponsorshipPolicies`

Validates which sponsorship policies apply to a UserOperation.

**RPC method:** `pm_validateSponsorshipPolicies`

### Signature

```typescript
async function validateSponsorshipPolicies(
    client: Client,
    args: ValidateSponsorshipPoliciesParameters
): Promise<ValidateSponsorshipPolicies>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation` | Yes | The UserOperation to validate |
| `entryPoint` | `Address` | Yes | EntryPoint address |
| `sponsorshipPolicyIds` | `string[]` | Yes | Policy IDs to check |

### Returns

Array of valid sponsorship policies with metadata.

---

## `getTokenQuotes`

Gets ERC-20 paymaster token quotes -- exchange rates for paying gas in tokens.

**RPC method:** `pimlico_getTokenQuotes`

### Signature

```typescript
async function getTokenQuotes(
    client: Client,
    args: GetTokenQuotesParameters
): Promise<GetTokenQuotesReturnType>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokens` | `Address[]` | Yes | ERC-20 token addresses to quote |
| `chain` | `Chain` | No | Target chain |
| `entryPointAddress` | `Address` | No | EntryPoint address |

### Returns

Array of token quote objects with exchange rates, paymaster addresses, and required amounts.

---

## `estimateErc20PaymasterCost`

Estimates the cost of using an ERC-20 token paymaster for a UserOperation.

### Signature

```typescript
async function estimateErc20PaymasterCost(
    client: Client,
    args: EstimateErc20PaymasterCostParameters
): Promise<EstimateErc20PaymasterCostReturnType>
```

---

## `sendCompressedUserOperation`

> **Deprecated:** This method is deprecated and may be removed in future versions.

Sends a compressed UserOperation to reduce calldata costs on L2s.

**RPC method:** `pimlico_sendCompressedUserOperation`

### Signature

```typescript
async function sendCompressedUserOperation(
    client: Client,
    args: SendCompressedUserOperationParameters
): Promise<Hash>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `compressedUserOperation` | `Hex` | Yes | Compressed UserOp data |
| `inflatorAddress` | `Address` | Yes | Inflator contract address |
| `entryPoint` | `Address` | Yes | EntryPoint address |
