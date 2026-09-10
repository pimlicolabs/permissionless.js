# ERC-4337 Overview

[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) is the Account Abstraction standard for Ethereum. It introduces smart contract wallets (smart accounts) controlled by arbitrary verification logic instead of a single private key. This document maps ERC-4337 concepts to their permissionless counterparts.

## Core Concepts

### UserOperation

A **UserOperation** is the ERC-4337 equivalent of a transaction. Users submit UserOperations to a bundler, which packages them into a regular transaction targeting the EntryPoint contract.

**In permissionless:**
- The type is viem's `UserOperation.UserOperation<"0.6" | "0.7" | "0.8" | "0.9">` from `viem/erc4337`
- You rarely build one by hand: `SmartAccountClient.create` does it when you call `sendTransaction()` or `sendCalls()`
- `getRequiredPrefund` computes the deposit a UserOperation needs

### EntryPoint

The **EntryPoint** is an on-chain singleton that validates and executes UserOperations. Four versions exist:

| Version | Status | viem constants (`viem/erc4337`) |
|---------|--------|---------------------------------|
| 0.6 | Legacy | `EntryPoint.addressV06`, `EntryPoint.abiV06` |
| 0.7 | Default for Safe, Kernel, Light, Thirdweb, Nexus, Etherspot | `EntryPoint.addressV07`, `EntryPoint.abiV07` |
| 0.8 | Default for Simple; EIP-712 UserOperation signing | `EntryPoint.addressV08`, `EntryPoint.abiV08` |
| 0.9 | Simple only (no default factory) | `EntryPoint.addressV09`, `EntryPoint.abiV09` |

**In permissionless:**
- Account constructors take an optional `entryPoint`: the version shorthand (`"0.7"`) or `{ address, version }`
- The default is per account (see the [accounts table](../accounts/README.md#account-summary)); `PimlicoClient.create` defaults to 0.7
- See [EntryPoint Versions](./02-entrypoint-versions.md)

### Bundler

A **bundler** collects UserOperations, validates them, and submits them to the EntryPoint in a bundle transaction.

**In permissionless:**
- The bundler URL is the `bundlerTransport` of `SmartAccountClient.create()`:
  ```typescript
  const client = SmartAccountClient.create({
      account,
      bundlerTransport: http("https://bundler.example.com")
  })
  ```
- Bundler RPC methods are viem's `BundlerClient` actions on `client.userOperation`:
  - `prepare` -- build the UserOperation (nonce, factory data, gas, paymaster, stub signature)
  - `estimateGas` -- `eth_estimateUserOperationGas`
  - `send` -- `eth_sendUserOperation`
  - `get` / `getReceipt` -- look up a UserOperation or its receipt by hash
  - `waitForReceipt` -- poll until it is included

### Paymaster

A **paymaster** is a contract that sponsors gas for UserOperations, either entirely (verifying paymaster) or against ERC-20 tokens.

**In permissionless:**
- The `paymaster` option of `SmartAccountClient.create()`:
  ```typescript
  const client = SmartAccountClient.create({
      account,
      bundlerTransport: http(bundlerUrl),
      // the bundler URL also serves pm_* methods
      paymaster: true,
      // or a paymaster client, e.g. PimlicoClient.create(...)
      paymaster: pimlicoClient,
      // or custom functions
      paymaster: {
          getData: async (userOperation) => { /* ... */ },
          getStubData: async (userOperation) => { /* ... */ }
      }
  })
  ```
- Pimlico paymaster actions: `Pimlico.sponsorUserOperation`, `Pimlico.validateSponsorshipPolicies`
- ERC-20 gas payment: `Erc20Paymaster.prepareUserOperation`, `Erc20Paymaster.getTokenQuotes`, `Erc20Paymaster.estimateCost`

### Smart Account

A **smart account** is a contract that validates UserOperations. Unlike an EOA, it can implement any logic: multi-sig, session keys, social recovery, passkeys.

**In permissionless:**
- The type is viem's `SmartAccount.SmartAccount` from `viem/erc4337`
- Accounts are built with `<X>SmartAccount.from()`: `SimpleSmartAccount.from`, `SafeSmartAccount.from`, `KernelSmartAccount.from`, …
- Each account exposes:
  - `address` -- counterfactual address (known before deployment)
  - `encodeCalls(calls)` / `decodeCalls(data)` -- account-specific execution calldata
  - `getNonce({ key? })` -- current nonce from the EntryPoint
  - `getStubSignature()` -- dummy signature for gas estimation
  - `sign({ hash })`, `signMessage(message)`, `signTypedData(typedData)` -- ERC-1271 signatures
  - `signUserOperation(userOperation)` -- sign a UserOperation
  - `getFactoryArgs()` -- `{ factory, factoryData }` until deployed
  - `isDeployed()` -- whether the address has code

### Factory

A **factory** deploys the account contract on first use. The first UserOperation carries factory data that triggers the deployment.

**In permissionless:**
- Each account constructor configures its factory; most have defaults, overridable with `factoryAddress`
- `getFactoryArgs()` returns `{ factory, factoryData }` for the first UserOperation and `{ factory: undefined, factoryData: undefined }` once deployed
- EIP-7702 accounts have no factory: the owner EOA is delegated instead (see [EIP-7702 Delegation](./04-eip-7702.md))

### Nonce

ERC-4337 uses a **2D nonce**: a 192-bit `key` and a 64-bit `sequence`. Different keys are independent lanes, so UserOperations on different keys do not block each other.

**In permissionless:**
- `Nonce.encode({ key, sequence })` packs a nonce (`(key << 64) + sequence`); `Nonce.decode(nonce)` unpacks it
- Every account's `getNonce({ key })` uses the per-call `key`, then the constructor's `nonceKey`, then `0n`

## UserOperation Lifecycle

```
1. Prepare (userOperation.prepare)
   ├── Counterfactual address (account.address)
   ├── Encode calls into calldata (encodeCalls)
   ├── Read the nonce from the EntryPoint (getNonce)
   └── Factory data if not deployed (getFactoryArgs)

2. Estimate Gas
   ├── Stub signature (getStubSignature)
   ├── Stub paymaster data if sponsored (paymaster.getStubData)
   └── eth_estimateUserOperationGas (userOperation.estimateGas)

3. Paymaster Data (if sponsored)
   └── paymaster.getData with the final gas values

4. Sign
   └── signUserOperation (the owner signs the UserOperation hash or typed data)

5. Send
   └── eth_sendUserOperation (userOperation.send)

6. Inclusion
   ├── The bundler bundles the UserOperation into a transaction
   ├── The EntryPoint validates and executes it
   └── userOperation.waitForReceipt polls for the receipt
```

`SmartAccountClient`'s `sendTransaction()` and `sendCalls()` run all six steps; you only provide the calls.
