# Clients

permissionless provides three client types, each built on viem's `Client` with specific decorators for different use cases.

## Client Types

| Client | Factory | Purpose |
|--------|---------|---------|
| [SmartAccountClient](./smart-account-client.md) | `createSmartAccountClient` | Send transactions via smart accounts through a bundler |
| [PimlicoClient](./pimlico-client.md) | `createPimlicoClient` | Interact with Pimlico's bundler and paymaster APIs |
| [PasskeyServerClient](./passkey-server-client.md) | `createPasskeyServerClient` | Manage WebAuthn/passkey credentials |

## The Decorator Pattern

permissionless uses viem's `.extend()` pattern to add functionality to clients. A decorator is a function that takes a client and returns an object of additional methods:

```typescript
// A decorator factory creates a decorator
const myDecorator = (config) => (client) => ({
    myMethod: (args) => doSomething(client, args),
})

// Applied via .extend()
const client = createClient({ transport: http(url) })
    .extend(myDecorator({ setting: true }))

// Now client.myMethod() is available
await client.myMethod({ ... })
```

### Available Decorators

| Decorator | Import | Methods Added |
|-----------|--------|---------------|
| `smartAccountActions` | `permissionless/clients` | `sendTransaction`, `signMessage`, `signTypedData`, `writeContract`, `sendCalls`, `getCallsStatus` |
| `pimlicoActions({ entryPoint })` | `permissionless/actions/pimlico` | `getUserOperationGasPrice`, `getUserOperationStatus`, `sponsorUserOperation`, `validateSponsorshipPolicies`, `getTokenQuotes`, `estimateErc20PaymasterCost`, `sendCompressedUserOperation` |
| `erc7579Actions()` | `permissionless/actions/erc7579` | `accountId`, `installModule`, `installModules`, `isModuleInstalled`, `supportsModule`, `supportsExecutionMode`, `uninstallModule`, `uninstallModules` |

## When to Use Which Client

- **SmartAccountClient** -- For sending transactions from a smart account. This is what most users need.
- **PimlicoClient** -- For interacting with Pimlico-specific APIs (gas price, sponsorship, token quotes). Can also be passed as the `paymaster` option to `createSmartAccountClient`.
- **PasskeyServerClient** -- For managing WebAuthn credentials via a passkey server.
