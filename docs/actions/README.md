# Actions

Actions are functions that take a client as their first argument. Provider-specific actions live on a namespace; the matching decorator adds them as methods to a client via `.extend()`.

## Action Categories

| Category | Symbols | Entrypoint | Decorator |
|----------|---------|------------|-----------|
| [Public](./public-actions.md) | `getAccountNonce`, `getSenderAddress` | `permissionless` | -- |
| [Smart Account](./smart-account-actions.md) | `sendTransaction`, `signMessage`, `signTypedData`, `writeContract` | `permissionless` | `smartAccountActions` (also adds `sendCalls`, `getCallsStatus`) |
| [ERC-7579](./erc7579-actions.md) | `Erc7579.*` | `permissionless` | `erc7579Actions()` |
| [Pimlico](./pimlico-actions.md) | `Pimlico.*` | `permissionless/pimlico` | `pimlicoActions({ entryPoint })` |
| [ERC-20 Paymaster](./erc20-paymaster.md) | `Erc20Paymaster.*` | `permissionless/pimlico` | `getTokenQuotes` and `estimateErc20PaymasterCost` ride `pimlicoActions` |
| [Etherspot](./etherspot-actions.md) | `Etherspot.getUserOperationGasPrice` | `permissionless/etherspot` | -- |
| [Passkey Server](./passkey-server-actions.md) | `PasskeyServer.*` | `permissionless/pimlico` | built into `PasskeyServerClient.create` |

## Standalone vs Decorator Usage

### Standalone

```typescript
import { EntryPoint } from "viem/erc4337"
import { getAccountNonce } from "permissionless"

const nonce = await getAccountNonce(publicClient, {
    address: "0x...",
    entryPointAddress: EntryPoint.addressV07
})
```

### Via Decorator

```typescript
import { erc7579Actions, SmartAccountClient } from "permissionless"

const client = SmartAccountClient.create({ ... }).extend(erc7579Actions())

const installed = await client.isModuleInstalled({
    type: "validator",
    address: "0x...",
    context: "0x"
})
```

Smart account actions are part of `SmartAccountClient.create`; no `.extend()` is needed for them.
