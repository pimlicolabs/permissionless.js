# Package Overview

`permissionless` is a TypeScript SDK for ERC-4337 Account Abstraction built on top of [viem](https://viem.sh). It provides smart account creation, UserOperation management, bundler/paymaster integration, and ERC-7579 module support.

## Module Hierarchy

The package uses [conditional exports](https://nodejs.org/api/packages.html#conditional-exports) to organize its API into subpath imports:

```
permissionless                    Root: utils + errors + clients
permissionless/accounts           12 smart account factory functions
permissionless/accounts/safe      Safe-specific helpers (multi-sig, WebAuthn)
permissionless/actions            Public actions (getAccountNonce, getSenderAddress)
permissionless/actions/erc7579    ERC-7579 module management
permissionless/actions/pimlico    Pimlico bundler/paymaster actions
permissionless/actions/smartAccount  Smart account actions (send, sign)
permissionless/actions/etherspot  Etherspot bundler actions
permissionless/actions/passkeyServer  Passkey/WebAuthn actions
permissionless/clients            createSmartAccountClient + smartAccountActions
permissionless/clients/pimlico    createPimlicoClient + pimlicoActions
permissionless/clients/passkeyServer  createPasskeyServerClient
permissionless/utils              18+ utility functions
permissionless/errors             Error classes
permissionless/experimental/pimlico  ERC-20 paymaster (experimental)
```

The root import (`permissionless`) re-exports everything from `utils`, `errors`, and `clients`. Accounts, provider-specific actions, and experimental features are only available via their subpath imports.

## Relationship to viem

permissionless extends viem's account abstraction module (`viem/account-abstraction`). It does not replace or wrap viem -- it builds on top of it.

**Types extended from viem:**
- `SmartAccount` / `SmartAccountImplementation` -- the interface every `to*SmartAccount()` factory returns
- `UserOperation<"0.6" | "0.7" | "0.8">` -- version-specific UserOperation types
- `BundlerActions` -- bundler RPC methods (`sendUserOperation`, `estimateUserOperationGas`, `getUserOperationReceipt`, etc.)
- `PaymasterActions` -- paymaster RPC methods (`getPaymasterData`, `getPaymasterStubData`)
- `Client`, `Transport`, `Chain` -- core viem client primitives
- `EntryPointVersion` -- `"0.6" | "0.7" | "0.8"` union type
- EntryPoint ABIs and addresses (`entryPoint06Abi`, `entryPoint07Abi`, `entryPoint08Abi`, `entryPoint07Address`, `entryPoint08Address`)

**What permissionless adds on top:**
- 12 smart account implementations (Simple, Safe, Kernel, Light, Biconomy, etc.)
- `createSmartAccountClient()` -- a bundler client pre-configured with smart account actions
- Provider-specific actions (Pimlico, Etherspot) and decorators
- ERC-7579 module management actions
- Passkey/WebAuthn server integration
- Utility functions for nonce encoding, UserOperation packing, gas estimation, ERC-20 overrides

## Decorator Pattern

permissionless uses viem's `.extend()` decorator pattern to add functionality to clients. Decorators are factory functions that take a client and return an object of additional methods.

```typescript
// A decorator is a function: (client) => { ...methods }
const pimlicoDecorator = pimlicoActions({ entryPoint: { address, version: "0.7" } })

// Applied via .extend()
const client = createClient({ transport: http(bundlerUrl) })
    .extend(bundlerActions)
    .extend(pimlicoDecorator)

// Now client has all bundler + pimlico methods
await client.getUserOperationGasPrice()
await client.sponsorUserOperation({ userOperation })
```

Three main decorators are provided:
- **`smartAccountActions`** -- adds `sendTransaction`, `signMessage`, `signTypedData`, `writeContract`, `sendCalls`, `getCallsStatus`
- **`pimlicoActions({ entryPoint })`** -- adds Pimlico-specific bundler/paymaster methods
- **`erc7579Actions()`** -- adds ERC-7579 module management methods

## Owner Abstraction

Smart accounts need an "owner" -- the key that signs UserOperations. permissionless accepts multiple owner types and normalizes them via `toOwner()`:

```typescript
type OwnerInput = EthereumProvider | WalletClient | LocalAccount
```

- **`LocalAccount`** -- a viem local account (private key, mnemonic, HD account)
- **`WalletClient`** -- a viem wallet client (browser wallet, WalletConnect)
- **`EthereumProvider`** -- raw EIP-1193 provider (`window.ethereum`)

All are converted to a `LocalAccount` internally, which provides `sign()`, `signMessage()`, and `signTypedData()`.

## Monorepo Structure

The repository is a monorepo with 4 workspace packages:

```
packages/
  permissionless/          Main SDK (published as `permissionless`)
  wagmi/                   Wagmi React hooks (published as `@permissionless/wagmi`)
  mock-paymaster/          Mock paymaster for testing (published as `@pimlico/mock-paymaster`)
  permissionless-test/     Test utilities and fixtures (private, not published)
  wagmi-demo/              Demo app (private, not published)
```

The `permissionless-test` package provides the `testWithRpc` fixture that spins up an isolated ERC-4337 stack (Anvil + Alto bundler + mock paymaster) per test. See [Testing Infrastructure](../testing/01-architecture.md) for details.
