# ERC-20 Paymaster

`Erc20Paymaster` bundles what paying gas in ERC-20 tokens through Pimlico's token paymaster needs: token quotes, a cost estimate, state overrides for estimation, and a `prepareUserOperation` hook for `SmartAccountClient`. It lives in `permissionless/pimlico`.

## Import

```typescript
import { Erc20Paymaster } from "permissionless/pimlico"
import type { Erc20Paymaster } from "permissionless/pimlico"
// Erc20Paymaster.PrepareUserOperationParameters,
// Erc20Paymaster.EstimateCostParameters, Erc20Paymaster.EstimateCostReturnType,
// Erc20Paymaster.GetTokenQuotesParameters, Erc20Paymaster.GetTokenQuotesReturnType,
// Erc20Paymaster.BalanceOverrideParameters, Erc20Paymaster.AllowanceOverrideParameters
```

---

## `Erc20Paymaster.prepareUserOperation`

Factory for the `userOperation.prepareUserOperation` hook of `SmartAccountClient.create`.

### Signature

```typescript
function Erc20Paymaster.prepareUserOperation(
    pimlicoClient: Pick<Client.Client, "chain" | "request">,
    options?: Erc20Paymaster.PrepareUserOperationParameters
): SmartAccountClient.PrepareUserOperationHook
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pimlicoClient` | `PimlicoClient.Client` (anything with `chain` and `request`) | Yes | -- | Answers `pimlico_getTokenQuotes` |
| `options.balanceOverride` | `boolean` | No | `false` | Simulate the token balance during gas estimation |
| `options.balanceSlot` | `bigint` | No | `balanceSlot` from the quote | Balance mapping slot used by `balanceOverride` |

### Usage

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { SimpleSmartAccount, SmartAccountClient } from "permissionless"
import { Erc20Paymaster, PimlicoClient } from "permissionless/pimlico"

const pimlicoUrl = "https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"
const pimlicoClient = PimlicoClient.create({ transport: http(pimlicoUrl) })

const account = await SimpleSmartAccount.from({
    client: Client.create({ chain: sepolia, transport: http() }),
    owner: Account.fromPrivateKey("0x...")
})

const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    paymasterContext: { token: "0xUsdc..." },
    userOperation: {
        prepareUserOperation: Erc20Paymaster.prepareUserOperation(pimlicoClient)
    }
})

// Gas is paid in the token
const hash = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 0n,
    data: "0x"
})
```

### What the hook does

The hook acts when the paymaster context (`paymasterContext` on the call, else on the client) carries a `token`; otherwise it runs viem's `userOperation.prepare` unchanged.

1. Fetches the quote for the token (`pimlico_getTokenQuotes`). No quote throws `TokenQuoteNotFoundError`.
2. Prepends an unlimited `approve(paymaster)` to the calls (decoding `callData` with `account.decodeCalls` when only that was given; mainnet USDT gets a zero approval first). With `balanceOverride`, merges `Erc20Paymaster.balanceOverride` into the estimation `stateOverride`; no known slot throws `BalanceSlotRequiredError`.
3. Runs viem's `userOperation.prepare` on those calls, answering `paymaster.getData` with the paymaster's `getStubData` so estimation uses stub paymaster data.
4. Computes the maximum token cost from the estimated gas, the quote's `postOpGas` and `exchangeRate` (the singleton paymaster's formula), reads the current allowance, and re-encodes `callData` with an exact `approve(paymaster, maxCostInToken)` only when the allowance falls short.
5. Fetches the final paymaster data for the updated UserOperation through `paymaster.getData` (`paymaster: true` uses the bundler, otherwise the paymaster client or custom functions; none throws `Erc20PaymasterRequiredError`) and returns the prepared UserOperation.

### Errors

- `AccountNotFoundError` -- no account on the client or the call
- `TokenQuoteNotFoundError` -- no quote for the token
- `BalanceSlotRequiredError` -- `balanceOverride` without a known balance slot
- `Erc20PaymasterRequiredError` -- no paymaster on the client or the call

---

## `Erc20Paymaster.getTokenQuotes`

**RPC method:** `pimlico_getTokenQuotes`

### Signature

```typescript
async function Erc20Paymaster.getTokenQuotes(
    client: Client,
    args: Erc20Paymaster.GetTokenQuotesParameters
): Promise<Erc20Paymaster.GetTokenQuotesReturnType>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokens` | `Address[]` | Yes | Tokens to quote |
| `entryPointAddress` | `Address` | Yes (standalone only) | EntryPoint |
| `chain` | `Chain.Chain` | No | Chain override; the client's chain otherwise |

### Returns

```typescript
{
    paymaster: Address
    token: Address
    postOpGas: bigint
    exchangeRate: bigint
    exchangeRateNativeToUsd: bigint
    balanceSlot?: bigint
    allowanceSlot?: bigint
}[]
```

Throws viem's `Chain.NotFoundError` when neither the client nor `chain` carries a chain.

---

## `Erc20Paymaster.estimateCost`

Cost of a prepared UserOperation in a token.

### Signature

```typescript
async function Erc20Paymaster.estimateCost(
    client: Client,
    args: Erc20Paymaster.EstimateCostParameters
): Promise<Erc20Paymaster.EstimateCostReturnType>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userOperation` | `UserOperation.UserOperation<entryPointVersion>` | Yes | Prepared UserOperation with gas fields filled |
| `token` | `Address` | Yes | Token to pay in |
| `entryPoint` | `{ address: Address, version: EntryPoint.Version }` | Yes (standalone only) | EntryPoint |
| `chain` | `Chain.Chain` | No | Chain override |

### Returns

```typescript
{
    costInToken: bigint
    costInUsd: bigint
}
```

Throws `TokenQuoteNotFoundError` when the token has no quote.

On `pimlicoActions` and `PimlicoClient` these two are the `getTokenQuotes` and `estimateErc20PaymasterCost` methods, with the EntryPoint filled from the decorator config.

---

## `Erc20Paymaster.balanceOverride` / `Erc20Paymaster.allowanceOverride`

State overrides for estimation; see [ERC-20 Utils](../utils/erc20-utils.md).

## Migrating from 0.x

- `prepareUserOperationForErc20Paymaster` from the `experimental/pimlico` subpath -> `Erc20Paymaster.prepareUserOperation` in `permissionless/pimlico`, no longer experimental.
- `getTokenQuotes` / `estimateErc20PaymasterCost` from the `actions/pimlico` subpath -> `Erc20Paymaster.getTokenQuotes` / `Erc20Paymaster.estimateCost`.
- `erc20BalanceOverride` / `erc20AllowanceOverride` from the `utils` subpath -> `Erc20Paymaster.balanceOverride` / `Erc20Paymaster.allowanceOverride`.
