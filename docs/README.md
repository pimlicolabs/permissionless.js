# permissionless

> TypeScript SDK for ERC-4337 Account Abstraction, built on [viem](https://viem.sh) 3

`permissionless` is a utility library for working with ERC-4337 smart accounts, bundlers, and paymasters. It extends viem's `viem/erc4337` primitives with eight smart account implementations, Pimlico and Etherspot bundler/paymaster actions, ERC-7579 module management, and EIP-7702 delegation.

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `viem` | `^3.0.0-next.10` during the `1.0.0-next` prereleases, `^3.0.0` at GA | Yes |
| `typescript` | `>=5.9.0` | No (types only) |

## Install

```bash
npm install permissionless viem
```

## Quick Start

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { SimpleSmartAccount, SmartAccountClient } from "permissionless"

// 1. The owner: the EOA that controls the smart account
const owner = Account.fromPrivateKey("0x...")

// 2. A public client for on-chain reads
const publicClient = Client.create({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org")
})

// 3. The smart account (computes the counterfactual address)
const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner
})

// 4. A smart account client (wraps a bundler)
const smartAccountClient = SmartAccountClient.create({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com")
})

// 5. Send a transaction (prepares, signs and submits a UserOperation)
const hash = await smartAccountClient.sendTransaction({
    to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    value: 0n,
    data: "0x"
})
```

## Documentation

### Architecture

- [Package Overview](./architecture/01-overview.md) -- entrypoints, namespaces, viem integration, decorator pattern
- [Export Map](./architecture/02-export-map.md) -- every entrypoint and symbol
- [Build System](./architecture/03-build-system.md) -- TypeScript compilation, output formats, tooling

### ERC-4337 Concepts

- [ERC-4337 Overview](./concepts/01-erc4337-overview.md) -- primitives mapped to library abstractions
- [EntryPoint Versions](./concepts/02-entrypoint-versions.md) -- 0.6, 0.7, 0.8 and 0.9
- [Smart Account Lifecycle](./concepts/03-smart-account-lifecycle.md) -- end-to-end UserOperation flow
- [EIP-7702 Delegation](./concepts/04-eip-7702.md) -- EOA code delegation support

### Smart Accounts

- [Accounts Overview](./accounts/README.md) -- common patterns, parameter reference, summary table
- [SimpleSmartAccount](./accounts/simple-smart-account.md)
- [SimpleSmartAccount (EIP-7702 mode)](./accounts/simple-smart-account.md#eip-7702-mode)
- [SafeSmartAccount](./accounts/safe-smart-account.md)
- [KernelSmartAccount](./accounts/kernel-smart-account.md)
- [LightSmartAccount](./accounts/light-smart-account.md)
- [TrustSmartAccount](./accounts/trust-smart-account.md)
- [EtherspotSmartAccount](./accounts/etherspot-smart-account.md)
- [NexusSmartAccount](./accounts/nexus-smart-account.md)
- [ThirdwebSmartAccount](./accounts/thirdweb-smart-account.md)

### Clients

- [Clients Overview](./clients/README.md) -- client namespaces, decorator pattern
- [SmartAccountClient](./clients/smart-account-client.md) -- `SmartAccountClient.create`
- [PimlicoClient](./clients/pimlico-client.md) -- `PimlicoClient.create` + `pimlicoActions`
- [PasskeyServerClient](./clients/passkey-server-client.md) -- `PasskeyServerClient.create`

### Actions

- [Actions Overview](./actions/README.md) -- action namespaces, standalone vs decorator usage
- [Public Actions](./actions/public-actions.md) -- `getAccountNonce`, `getSenderAddress`
- [Smart Account Actions](./actions/smart-account-actions.md) -- `sendTransaction`, `sendCalls`, `signMessage`, `signTypedData`, `writeContract`
- [Pimlico Actions](./actions/pimlico-actions.md) -- `Pimlico`: gas price, sponsorship, policies
- [ERC-20 Paymaster](./actions/erc20-paymaster.md) -- `Erc20Paymaster`: token quotes, cost estimate, `prepareUserOperation` hook
- [ERC-7579 Actions](./actions/erc7579-actions.md) -- `Erc7579`: module install/uninstall/query
- [Etherspot Actions](./actions/etherspot-actions.md) -- `Etherspot.getUserOperationGasPrice`
- [Passkey Server Actions](./actions/passkey-server-actions.md) -- `PasskeyServer`: WebAuthn registration/authentication

### Utilities

- [Utils Overview](./utils/README.md) -- what stayed public and where it lives
- [Nonce Utils](./utils/nonce-utils.md) -- `Nonce.encode`, `Nonce.decode`
- [UserOperation Utils](./utils/user-operation-utils.md) -- `getRequiredPrefund`
- [ERC-7579 Utils](./utils/erc7579-utils.md) -- `Erc7579.encodeCalls`, `Erc7579.decodeCalls`, `Erc7579.encodeInstallModule`, `Erc7579.encodeUninstallModule`
- [ERC-20 Utils](./utils/erc20-utils.md) -- `Erc20Paymaster.balanceOverride`, `Erc20Paymaster.allowanceOverride`
- [Account Utils](./utils/account-utils.md) -- `Owner.from`

### Types & Errors

- [Types & Errors Overview](./types-and-errors/README.md)
- [Errors](./types-and-errors/errors.md) -- every named error class, grouped by module
- [RPC Schemas](./types-and-errors/rpc-schemas.md) -- `PimlicoClient.Schema`, `Etherspot.Schema`, `PasskeyServerClient.Schema`

### Experimental

- [Experimental Overview](./experimental/README.md) -- `permissionless/experimental` is empty in 1.0

### Testing

- [Testing Infrastructure](./testing/01-architecture.md) -- existing test docs (6 files)

## External Resources

- [Pimlico Documentation](https://docs.pimlico.io/permissionless) -- hosted user guides and tutorials
- [GitHub Repository](https://github.com/pimlicolabs/permissionless.js)
- [viem Documentation](https://viem.sh)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
