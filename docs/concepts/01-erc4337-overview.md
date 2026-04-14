# ERC-4337 Overview

[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) is the Account Abstraction standard for Ethereum. It introduces smart contract wallets (smart accounts) that can be controlled by arbitrary verification logic instead of a single private key. This document maps ERC-4337 concepts to their permissionless library counterparts.

## Core Concepts

### UserOperation

A **UserOperation** is the ERC-4337 equivalent of a transaction. Instead of sending a transaction directly, users submit UserOperations to a bundler, which packages them into a regular transaction targeting the EntryPoint contract.

**In permissionless:**
- The `UserOperation` type comes from `viem/account-abstraction`, parameterized by EntryPoint version: `UserOperation<"0.6" | "0.7" | "0.8">`
- You rarely construct UserOperations manually -- `createSmartAccountClient` handles it when you call `sendTransaction()` or `sendCalls()`
- Utility functions for working with raw UserOperations: `getPackedUserOperation()`, `getRequiredPrefund()`

### EntryPoint

The **EntryPoint** is an on-chain singleton contract that validates and executes UserOperations. Three versions exist:

| Version | Status | Library Constant |
|---------|--------|-----------------|
| 0.6 | Legacy | `entryPoint06Abi` (from viem) |
| 0.7 | Current default | `entryPoint07Address`, `entryPoint07Abi` (from viem) |
| 0.8 | Latest (EIP-7702) | `entryPoint08Address`, `entryPoint08Abi` (from viem) |

**In permissionless:**
- Most functions accept an optional `entryPoint` parameter: `{ address: Address, version: "0.6" | "0.7" | "0.8" }`
- When omitted, defaults to EntryPoint 0.7
- See [EntryPoint Versions](./02-entrypoint-versions.md) for detailed differences

### Bundler

A **bundler** collects UserOperations from users, validates them, and submits them to the EntryPoint contract in a bundle transaction.

**In permissionless:**
- The bundler URL is the `bundlerTransport` in `createSmartAccountClient()`:
  ```typescript
  const client = createSmartAccountClient({
      account,
      bundlerTransport: http("https://bundler.example.com"),
  })
  ```
- Bundler RPC methods are available via viem's `BundlerActions`:
  - `sendUserOperation` -- submit a UserOp to the bundler
  - `estimateUserOperationGas` -- estimate gas for a UserOp
  - `getUserOperationByHash` -- look up a UserOp by hash
  - `getUserOperationReceipt` -- get the receipt of an executed UserOp
  - `getSupportedEntryPoints` -- list EntryPoint versions the bundler supports

### Paymaster

A **paymaster** is a contract that sponsors gas fees for UserOperations. It can pay fees entirely (verifying paymaster) or accept ERC-20 tokens instead of ETH.

**In permissionless:**
- Paymaster integration via the `paymaster` option on `createSmartAccountClient()`:
  ```typescript
  const client = createSmartAccountClient({
      account,
      bundlerTransport: http(bundlerUrl),
      // Simple: bundler also acts as paymaster
      paymaster: true,
      // Or custom paymaster functions:
      paymaster: {
          getPaymasterData: async (userOperation) => { /* ... */ },
          getPaymasterStubData: async (userOperation) => { /* ... */ },
      },
  })
  ```
- Pimlico-specific paymaster actions: `sponsorUserOperation()`, `getTokenQuotes()`, `validateSponsorshipPolicies()`
- Experimental ERC-20 paymaster: `prepareUserOperationForErc20Paymaster()`

### Smart Account

A **smart account** (or smart contract wallet) is a contract that can validate UserOperations. Unlike EOAs, smart accounts can implement arbitrary logic: multi-sig, session keys, social recovery, passkeys, etc.

**In permissionless:**
- The `SmartAccount` type comes from `viem/account-abstraction`
- Created by factory functions: `toSimpleSmartAccount()`, `toSafeSmartAccount()`, `toKernelSmartAccount()`, etc.
- Each factory returns a `SmartAccount` with these methods:
  - `getAddress()` -- counterfactual address (works before deployment)
  - `encodeCalls(calls)` -- encode calls into account-specific calldata
  - `decodeCalls(data)` -- decode calldata back to calls
  - `getNonce()` -- get current nonce from EntryPoint
  - `getStubSignature()` -- dummy signature for gas estimation
  - `sign(hash)` -- sign a hash
  - `signMessage(message)` -- EIP-191 message signature
  - `signTypedData(typedData)` -- EIP-712 typed data signature
  - `signUserOperation(userOperation)` -- sign a UserOperation

### Factory

A **factory** deploys smart account contracts on first use. The first UserOperation from a new account includes factory data that triggers deployment.

**In permissionless:**
- Each `to*SmartAccount()` factory configures the factory internally
- The `getFactoryArgs()` method returns `{ factory: Address, factoryData: Hex }` for the first UserOp
- After deployment, `getFactoryArgs()` returns `undefined`
- Most account types have default factory addresses; custom ones can be passed via `factoryAddress`

### Nonce

ERC-4337 uses a **2D nonce** system with a `key` (24 bytes) and `sequence` (8 bytes). The key allows parallel nonce lanes -- multiple in-flight UserOperations that don't block each other.

**In permissionless:**
- `encodeNonce({ key, sequence })` -- packs key and sequence into a single `bigint`: `(key << 64) + sequence`
- `decodeNonce(nonce)` -- unpacks a `bigint` back to `{ key, sequence }`
- The `nonceKey` parameter on smart account factories sets the default nonce key

## UserOperation Lifecycle

The full lifecycle of a UserOperation, from creation to on-chain execution:

```
1. Prepare
   ├── Get counterfactual address (getAddress)
   ├── Encode calls into calldata (encodeCalls)
   ├── Get nonce from EntryPoint (getNonce)
   └── Get factory data if not deployed (getFactoryArgs)

2. Estimate Gas
   ├── Get stub signature for estimation (getStubSignature)
   ├── Get paymaster stub data if sponsored (getPaymasterStubData)
   └── Call estimateUserOperationGas on bundler

3. Get Paymaster Data (if sponsored)
   └── Call getPaymasterData with final gas values

4. Sign
   └── Call signUserOperation (owner signs the UserOp hash)

5. Send to Bundler
   └── Call eth_sendUserOperation on bundler RPC

6. Wait for Inclusion
   ├── Bundler bundles the UserOp into a transaction
   ├── Transaction submitted to mempool
   ├── EntryPoint validates and executes
   └── Poll getUserOperationReceipt for the result
```

When using `createSmartAccountClient`, steps 1-6 are handled automatically by `sendTransaction()` or `sendCalls()`. You only provide the calls you want to execute.
