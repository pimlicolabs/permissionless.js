# Pimlico Actions

Actions for Pimlico's bundler and paymaster RPC. They live on the `Pimlico` namespace in `permissionless/pimlico`; `pimlicoActions({ entryPoint })` attaches them (plus the ERC-20 paymaster helpers) to a client, and `PimlicoClient.create` does that for you.

## Import

```typescript
import { Pimlico, pimlicoActions } from "permissionless/pimlico"
import type { Pimlico } from "permissionless/pimlico"
// Pimlico.Actions, Pimlico.GetUserOperationGasPriceReturnType,
// Pimlico.GetUserOperationStatusParameters, Pimlico.GetUserOperationStatusReturnType,
// Pimlico.SponsorUserOperationParameters, Pimlico.SponsorUserOperationReturnType,
// Pimlico.ValidateSponsorshipPoliciesParameters, Pimlico.ValidateSponsorshipPolicies
```

## `pimlicoActions` Decorator

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

Methods added: `getUserOperationGasPrice`, `getUserOperationStatus`, `sponsorUserOperation`, `validateSponsorshipPolicies`, `getTokenQuotes`, `estimateErc20PaymasterCost`. The decorator supplies the EntryPoint from its config, so the method forms drop `entryPoint` / `entryPointAddress`.

---

## `Pimlico.getUserOperationGasPrice`

Gas price recommendations at three speed tiers.

**RPC method:** `pimlico_getUserOperationGasPrice`

### Signature

```typescript
async function Pimlico.getUserOperationGasPrice(
    client: Client
): Promise<Pimlico.GetUserOperationGasPriceReturnType>
```

### Returns

```typescript
{
    slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
    standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
    fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
}
```

### Example

```typescript
const gasPrice = await pimlicoClient.getUserOperationGasPrice()
gasPrice.standard.maxFeePerGas
```

---

## `Pimlico.getUserOperationStatus`

Status of a submitted UserOperation.

**RPC method:** `pimlico_getUserOperationStatus`

### Signature

```typescript
async function Pimlico.getUserOperationStatus(
    client: Client,
    args: Pimlico.GetUserOperationStatusParameters
): Promise<Pimlico.GetUserOperationStatusReturnType>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hash` | `Hex` | Yes | UserOperation hash |

### Returns

```typescript
{
    status: "not_found" | "not_submitted" | "submitted" | "rejected" | "reverted" | "included" | "failed"
    transactionHash: Hex | null
}
```

### Example

```typescript
const { status, transactionHash } = await pimlicoClient.getUserOperationStatus({
    hash: "0x..."
})
```

---

## `Pimlico.sponsorUserOperation`

Asks Pimlico to sponsor a UserOperation. `SmartAccountClient.create({ paymaster: pimlicoClient })` sponsors automatically through viem's paymaster flow (`pm_getPaymasterStubData`, `pm_getPaymasterData`); this is the manual form.

**RPC method:** `pm_sponsorUserOperation`

### Signature

```typescript
async function Pimlico.sponsorUserOperation<entryPointVersion extends EntryPoint.Version>(
    client: Client,
    args: Pimlico.SponsorUserOperationParameters<entryPointVersion>
): Promise<Pimlico.SponsorUserOperationReturnType<entryPointVersion>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation.UserOperation<entryPointVersion>` with the gas limits optional | Yes | The UserOperation to sponsor |
| `entryPoint` | `{ address: Address, version: EntryPoint.Version }` | Yes (standalone only) | EntryPoint |
| `sponsorshipPolicyId` | `string` | No | Sponsorship policy to apply |
| `paymasterContext` | `unknown` | No | Context forwarded to the paymaster |

### Returns

EntryPoint 0.7, 0.8, 0.9:

```typescript
{
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
    paymaster: Address
    paymasterVerificationGasLimit: bigint
    paymasterPostOpGasLimit: bigint
    paymasterData: Hex
}
```

EntryPoint 0.6:

```typescript
{
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
    paymasterAndData: Hex
}
```

### Example

```typescript
const sponsorship = await pimlicoClient.sponsorUserOperation({
    userOperation,
    sponsorshipPolicyId: "sp_..."
})
```

---

## `Pimlico.validateSponsorshipPolicies`

Which of the given sponsorship policies would sponsor a UserOperation.

**RPC method:** `pm_validateSponsorshipPolicies`

### Signature

```typescript
async function Pimlico.validateSponsorshipPolicies(
    client: Client,
    args: Pimlico.ValidateSponsorshipPoliciesParameters
): Promise<Pimlico.ValidateSponsorshipPolicies[]>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation.UserOperation` | Yes | The UserOperation to check |
| `entryPointAddress` | `Address` | Yes (standalone only) | EntryPoint address |
| `sponsorshipPolicyIds` | `string[]` | Yes | Policies to check |

### Returns

```typescript
{
    sponsorshipPolicyId: string
    data: {
        name: string | null
        author: string | null
        icon: string | null
        description: string | null
    }
}[]
```

---

## ERC-20 paymaster methods

`getTokenQuotes` and `estimateErc20PaymasterCost` on the decorator call `Erc20Paymaster.getTokenQuotes` and `Erc20Paymaster.estimateCost`. See [ERC-20 Paymaster](./erc20-paymaster.md).

## Migrating from 0.x

- The `actions/pimlico` subpath -> the `Pimlico` namespace in `permissionless/pimlico`.
- `PimlicoSponsorUserOperationParameters` -> `Pimlico.SponsorUserOperationParameters`.
- `getTokenQuotes` and `estimateErc20PaymasterCost` moved to `Erc20Paymaster` (`getTokenQuotes`, `estimateCost`); the decorator methods keep their names.
- `sendCompressedUserOperation` (`pimlico_sendCompressedUserOperation`) is removed.
