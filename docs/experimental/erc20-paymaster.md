# ERC-20 Paymaster (Experimental)

> **Experimental:** This API may change in future versions.

`prepareUserOperationForErc20Paymaster` is a factory function that creates a `prepareUserOperation` hook for paying gas fees with ERC-20 tokens via Pimlico's token paymaster.

## Import

```typescript
import { prepareUserOperationForErc20Paymaster } from "permissionless/experimental/pimlico"
```

## How It Works

The function returns a `prepareUserOperation` hook that:

1. Calls `getTokenQuotes` on the Pimlico client to get exchange rates
2. Determines how much of the ERC-20 token is needed to cover gas
3. Adds an ERC-20 `approve` call to the UserOperation (for the paymaster contract)
4. Applies `erc20BalanceOverride` and `erc20AllowanceOverride` state overrides for accurate gas estimation

## Factory Signature

```typescript
function prepareUserOperationForErc20Paymaster(
    pimlicoClient: PimlicoClient,
    options?: {
        balanceOverride?: boolean,
        balanceSlot?: bigint,
    }
): (client: Client, parameters: PrepareUserOperationParameters) => Promise<PrepareUserOperationReturnType>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pimlicoClient` | `PimlicoClient` | Yes | -- | Pimlico client for token quotes |
| `options.balanceOverride` | `boolean` | No | `true` | Whether to use balance state overrides for estimation |
| `options.balanceSlot` | `bigint` | No | Auto-detected | Storage slot of the token's balance mapping |

### Returns

A `prepareUserOperation` function compatible with `createSmartAccountClient`'s `userOperation.prepareUserOperation` option.

## Usage

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toSimpleSmartAccount } from "permissionless/accounts"
import { createSmartAccountClient } from "permissionless"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { prepareUserOperationForErc20Paymaster } from "permissionless/experimental/pimlico"

// 1. Create clients
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

const pimlicoClient = createPimlicoClient({
    transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
})

// 2. Create account
const account = await toSimpleSmartAccount({
    client: publicClient,
    owner: privateKeyToAccount("0x..."),
})

// 3. Create smart account client with ERC-20 paymaster
const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY"),
    paymaster: pimlicoClient,
    userOperation: {
        prepareUserOperation: prepareUserOperationForErc20Paymaster(pimlicoClient),
    },
})

// 4. Send transaction -- gas is paid in the ERC-20 token
const hash = await smartAccountClient.sendTransaction({
    to: "0x...",
    value: 0n,
    data: "0x",
})
```

## How the Hook Modifies UserOperations

When `prepareUserOperation` is called:

1. **Get token quotes:** Calls `pimlico_getTokenQuotes` to determine which tokens are accepted and their exchange rates
2. **Calculate cost:** Estimates how much of the token is needed based on gas limits and exchange rate
3. **Prepend approval:** Adds an `approve(paymaster, amount)` call before the user's calls
4. **State overrides:** Applies `erc20BalanceOverride` and `erc20AllowanceOverride` so the gas estimation call succeeds even if the account doesn't have tokens yet
5. **Return modified parameters:** The UserOperation now includes the approval and paymaster data

## Notes

- The account must hold sufficient ERC-20 tokens to cover gas at the quoted exchange rate
- Token approval is automatically prepended to the UserOperation calls
- State overrides ensure gas estimation works correctly even before the account has tokens
- The `balanceSlot` option may need to be specified for non-standard ERC-20 tokens
