# permissionless

> **Version 0.3.5** | TypeScript SDK for ERC-4337 Account Abstraction, built on [viem](https://viem.sh)

`permissionless` is a utility library for working with ERC-4337 smart accounts, bundlers, and paymasters. It extends viem's account abstraction primitives with support for 12 smart account implementations, multiple bundler providers, ERC-7579 modular accounts, and EIP-7702 delegation.

## Peer Dependencies

| Package | Version | Required |
|---------|---------|----------|
| `viem`  | `^2.44.4` | Yes |
| `ox`    | `^0.11.3` | No (optional, for WebAuthn/passkey features) |

## Install

```bash
npm install permissionless viem
```

## Quick Start

```typescript
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { toSimpleSmartAccount } from "permissionless/accounts"
import { createSmartAccountClient } from "permissionless"

// 1. Create an owner (the EOA that controls the smart account)
const owner = privateKeyToAccount("0x...")

// 2. Create a public client for on-chain reads
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.sepolia.org"),
})

// 3. Create the smart account (computes counterfactual address)
const account = await toSimpleSmartAccount({
    client: publicClient,
    owner,
})

// 4. Create a smart account client (wraps a bundler)
const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http("https://bundler.example.com"),
})

// 5. Send a transaction (creates, signs, and submits a UserOperation)
const txHash = await smartAccountClient.sendTransaction({
    to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    value: 0n,
    data: "0x",
})
```

## Documentation

### Architecture

- [Package Overview](./architecture/01-overview.md) -- module hierarchy, viem integration, decorator pattern
- [Export Map](./architecture/02-export-map.md) -- complete inventory of every subpath export and symbol
- [Build System](./architecture/03-build-system.md) -- TypeScript compilation, output formats, tooling

### ERC-4337 Concepts

- [ERC-4337 Overview](./concepts/01-erc4337-overview.md) -- primitives mapped to library abstractions
- [EntryPoint Versions](./concepts/02-entrypoint-versions.md) -- 0.6 vs 0.7 vs 0.8 comparison
- [Smart Account Lifecycle](./concepts/03-smart-account-lifecycle.md) -- end-to-end UserOperation flow
- [EIP-7702 Delegation](./concepts/04-eip-7702.md) -- EOA code delegation support

### Smart Accounts

- [Accounts Overview](./accounts/README.md) -- common patterns, parameter reference, summary table
- [SimpleSmartAccount](./accounts/simple-smart-account.md)
- [SimpleSmartAccount (EIP-7702)](./accounts/simple-smart-account-7702.md)
- [SafeSmartAccount](./accounts/safe-smart-account.md)
- [KernelSmartAccount](./accounts/kernel-smart-account.md)
- [EcdsaKernelSmartAccount](./accounts/ecdsa-kernel-smart-account.md)
- [KernelSmartAccount (EIP-7702)](./accounts/kernel-smart-account-7702.md)
- [LightSmartAccount](./accounts/light-smart-account.md)
- [BiconomySmartAccount](./accounts/biconomy-smart-account.md)
- [TrustSmartAccount](./accounts/trust-smart-account.md)
- [EtherspotSmartAccount](./accounts/etherspot-smart-account.md)
- [NexusSmartAccount](./accounts/nexus-smart-account.md)
- [ThirdwebSmartAccount](./accounts/thirdweb-smart-account.md)

### Clients

- [Clients Overview](./clients/README.md) -- client types, decorator pattern
- [SmartAccountClient](./clients/smart-account-client.md) -- `createSmartAccountClient`
- [PimlicoClient](./clients/pimlico-client.md) -- `createPimlicoClient` + `pimlicoActions`
- [PasskeyServerClient](./clients/passkey-server-client.md) -- `createPasskeyServerClient`

### Actions

- [Actions Overview](./actions/README.md) -- action system, standalone vs decorator usage
- [Public Actions](./actions/public-actions.md) -- `getAccountNonce`, `getSenderAddress`
- [Smart Account Actions](./actions/smart-account-actions.md) -- `sendTransaction`, `sendCalls`, `signMessage`, `signTypedData`, `writeContract`
- [Pimlico Actions](./actions/pimlico-actions.md) -- gas price, sponsorship, token quotes
- [ERC-7579 Actions](./actions/erc7579-actions.md) -- module install/uninstall/query
- [Etherspot Actions](./actions/etherspot-actions.md) -- Etherspot bundler actions
- [Passkey Server Actions](./actions/passkey-server-actions.md) -- WebAuthn registration/authentication

### Utilities

- [Utils Overview](./utils/README.md) -- utility categories
- [Nonce Utils](./utils/nonce-utils.md) -- `encodeNonce`, `decodeNonce`
- [UserOperation Utils](./utils/user-operation-utils.md) -- `getPackedUserOperation`, `getRequiredPrefund`, `deepHexlify`
- [ERC-7579 Utils](./utils/erc7579-utils.md) -- `encode7579Calls`, `decode7579Calls`, `encodeInstallModule`
- [ERC-20 Utils](./utils/erc20-utils.md) -- `erc20AllowanceOverride`, `erc20BalanceOverride`
- [Account Utils](./utils/account-utils.md) -- `isSmartAccountDeployed`, `toOwner`

### Types & Errors

- [Types & Errors Overview](./types-and-errors/README.md)
- [Errors](./types-and-errors/errors.md) -- `AccountNotFoundError`, `InvalidEntryPointError`
- [RPC Schemas](./types-and-errors/rpc-schemas.md) -- `PimlicoRpcSchema`, `EtherspotBundlerRpcSchema`

### Experimental

- [Experimental Overview](./experimental/README.md) -- stability warning
- [ERC-20 Paymaster](./experimental/erc20-paymaster.md) -- `prepareUserOperationForErc20Paymaster`

### Testing

- [Testing Infrastructure](./testing/01-architecture.md) -- existing test docs (6 files)

## External Resources

- [Pimlico Documentation](https://docs.pimlico.io/permissionless) -- hosted user guides and tutorials
- [GitHub Repository](https://github.com/pimlicolabs/permissionless.js)
- [viem Documentation](https://viem.sh)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
