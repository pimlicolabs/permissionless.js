# Actions

Actions are functions that interact with smart accounts, bundlers, and paymasters. They can be used standalone or via client decorators.

## Action Categories

| Category | Import | Description |
|----------|--------|-------------|
| [Public](./public-actions.md) | `permissionless/actions` | Read-only actions: get nonce, get sender address |
| [Smart Account](./smart-account-actions.md) | `permissionless/actions/smartAccount` | Send transactions, sign messages via smart accounts |
| [Pimlico](./pimlico-actions.md) | `permissionless/actions/pimlico` | Pimlico bundler/paymaster: gas price, sponsorship |
| [ERC-7579](./erc7579-actions.md) | `permissionless/actions/erc7579` | Module management: install, uninstall, query |
| [Etherspot](./etherspot-actions.md) | `permissionless/actions/etherspot` | Etherspot bundler: gas price |
| [Passkey Server](./passkey-server-actions.md) | `permissionless/actions/passkeyServer` | WebAuthn registration and authentication |

## Standalone vs Decorator Usage

Actions can be called directly (standalone) or via a client decorator:

### Standalone

```typescript
import { getAccountNonce } from "permissionless/actions"

const nonce = await getAccountNonce(publicClient, {
    address: "0x...",
    entryPointAddress: entryPoint07Address,
})
```

### Via Decorator

```typescript
import { erc7579Actions } from "permissionless/actions/erc7579"

const client = createSmartAccountClient({ ... })
    .extend(erc7579Actions())

// Now available as a method on the client
const installed = await client.isModuleInstalled({
    type: "validator",
    address: "0x...",
    context: "0x",
})
```

Smart account actions (`sendTransaction`, `signMessage`, etc.) are automatically included in `createSmartAccountClient` -- no manual `.extend()` needed.
