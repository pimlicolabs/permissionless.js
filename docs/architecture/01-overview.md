# Package Overview

`permissionless` is a TypeScript SDK for ERC-4337 Account Abstraction built on top of [viem](https://viem.sh) 3. It provides smart account constructors, UserOperation management, bundler/paymaster integration, and ERC-7579 module support.

## Entrypoints

The package has five [conditional exports](https://nodejs.org/api/packages.html#conditional-exports) (inventory in the [export map](./02-export-map.md)):

```
permissionless               8 account namespaces, SmartAccountClient, Erc7579 + erc7579Actions,
                             public and smart-account actions, smartAccountActions, Nonce, Owner,
                             getRequiredPrefund, error classes
permissionless/pimlico       PimlicoClient, Pimlico + pimlicoActions, PasskeyServerClient,
                             PasskeyServer, Erc20Paymaster
permissionless/etherspot     Etherspot
permissionless/experimental  empty; reserved for pre-release APIs
permissionless/package.json  tooling
```

Every public surface is an ES module namespace (`export * as X`): `SafeSmartAccount.from`, `SmartAccountClient.create`, `Pimlico.sponsorUserOperation`, `Erc7579.installModule`, `Nonce.encode`. The 0.x deep subpaths (`accounts`, `actions/*`, `clients/*`, `utils`, `errors`, `experimental/pimlico`) are gone.

## Relationship to viem

permissionless extends viem 3's `viem/erc4337` module. It does not replace or wrap viem -- it builds on top of it.

**From viem:**
- `SmartAccount.from`, `SmartAccount.SmartAccount`, `SmartAccount.Implementation` -- what every `<X>SmartAccount.from` builds on and returns
- `UserOperation.UserOperation<"0.6" | "0.7" | "0.8" | "0.9">`, `UserOperation.hash`, `UserOperation.toTypedData`
- `BundlerClient.create` / `BundlerClient.Client` -- the base of `SmartAccountClient` and `PimlicoClient`, with `userOperation.prepare`, `estimateGas`, `send`, `get`, `getReceipt`, `waitForReceipt`
- `PaymasterClient` -- `paymaster.getData`, `paymaster.getStubData`
- `EntryPoint.Version`, `EntryPoint.addressV06` … `addressV09`, `EntryPoint.abiV06` … `abiV09`
- `Client`, `Transport`, `Chain`, `Account` -- core primitives

**What permissionless adds:**
- 8 smart account implementations (Simple, Safe, Kernel, Light, Trust, Etherspot, Nexus, Thirdweb)
- `SmartAccountClient.create()` -- a bundler client pre-configured with smart-account actions
- Pimlico and Etherspot actions and decorators, ERC-20 paymaster support
- ERC-7579 module management
- Passkey server integration
- `Nonce`, `Owner`, `getRequiredPrefund`, and a named error class for every throw

## Decorator Pattern

permissionless uses viem's `.extend()` decorator pattern. Decorators take a client and return an object of methods.

```typescript
import { Client, http } from "viem"
import { EntryPoint } from "viem/erc4337"
import { pimlicoActions } from "permissionless/pimlico"

const client = Client.create({ transport: http(bundlerUrl) }).extend(
    pimlicoActions({
        entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
    })
)

await client.getUserOperationGasPrice()
await client.sponsorUserOperation({ userOperation })
```

Three decorators are provided:
- **`smartAccountActions`** -- `sendTransaction`, `sendCalls`, `getCallsStatus`, `signMessage`, `signTypedData`, `writeContract`
- **`pimlicoActions({ entryPoint })`** -- Pimlico bundler/paymaster methods
- **`erc7579Actions()`** -- ERC-7579 module management methods

## Owner Abstraction

Smart accounts need an owner, the key that signs UserOperations. Constructors accept several owner types and normalise them with `Owner.from`:

```typescript
type Owner = Account.Local | WalletClient | EthereumProvider
```

- **`Account.Local`** -- a viem local account (private key, mnemonic, HD account)
- **Wallet client** -- a viem `Client` with an account (browser wallet, WalletConnect)
- **`EthereumProvider`** -- an object with an EIP-1193 `request` (`window.ethereum`)

All become an `Account.Local` with `signMessage` and `signTypedData`; `sign` (raw hash) works for local accounts only. Safe additionally accepts WebAuthn accounts and address-only accounts for owners that sign elsewhere.

## Monorepo Structure

The repository is a bun workspace:

```
packages/
  permissionless/          Main SDK (published as `permissionless`)
  wagmi/                   Wagmi React hooks (published as `@permissionless/wagmi`)
  mock-paymaster/          Mock paymaster for testing (published as `@pimlico/mock-paymaster`)
  permissionless-test/     Test rig and fixtures (private, not published)
  wagmi-demo/              Demo app (private, not published)
```

`permissionless-test` provides the `testWithRpc` fixture that spins up an isolated ERC-4337 stack (Anvil + Alto bundler + mock paymaster) per worker, plus one rig helper file per account under `src/accounts/`. See [Testing Infrastructure](../testing/01-architecture.md).
