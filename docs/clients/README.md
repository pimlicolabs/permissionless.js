# Clients

permissionless provides three client namespaces, each a viem 3 `Client` with a decorator applied. `create` builds the client; `Client` and `Config` are its types.

## Client Types

| Client | Constructor | Entrypoint | Purpose |
|--------|-------------|------------|---------|
| [SmartAccountClient](./smart-account-client.md) | `SmartAccountClient.create` | `permissionless` | Send UserOperations from a smart account through a bundler |
| [PimlicoClient](./pimlico-client.md) | `PimlicoClient.create` | `permissionless/pimlico` | Pimlico bundler and paymaster APIs |
| [PasskeyServerClient](./passkey-server-client.md) | `PasskeyServerClient.create` | `permissionless/pimlico` | WebAuthn/passkey credentials on a passkey server |

## The Decorator Pattern

permissionless uses viem's `.extend()` pattern to add methods to clients. A decorator is a function that takes a client and returns an object of methods:

```typescript
import { Client, http } from "viem"

const myDecorator = (config) => (client) => ({
    myMethod: (args) => doSomething(client, args)
})

const client = Client.create({ transport: http(url) })
    .extend(myDecorator({ setting: true }))

await client.myMethod({ ... })
```

### Available Decorators

| Decorator | Import | Methods Added |
|-----------|--------|---------------|
| `smartAccountActions` | `permissionless` | `sendTransaction`, `sendCalls`, `getCallsStatus`, `signMessage`, `signTypedData`, `writeContract` |
| `erc7579Actions()` | `permissionless` | `accountId`, `installModule`, `installModules`, `isModuleInstalled`, `supportsModule`, `supportsExecutionMode`, `uninstallModule`, `uninstallModules` |
| `pimlicoActions({ entryPoint })` | `permissionless/pimlico` | `getUserOperationGasPrice`, `getUserOperationStatus`, `sponsorUserOperation`, `validateSponsorshipPolicies`, `getTokenQuotes`, `estimateErc20PaymasterCost` |

`smartAccountActions` is a plain decorator; `erc7579Actions` and `pimlicoActions` are factories that return one.

## When to Use Which Client

- **SmartAccountClient** -- sending transactions from a smart account. This is what most users need.
- **PimlicoClient** -- Pimlico-specific APIs (gas price, sponsorship, token quotes). Passing it as `paymaster` to `SmartAccountClient.create` sponsors every UserOperation through Pimlico.
- **PasskeyServerClient** -- registering and authenticating WebAuthn credentials against a passkey server.
