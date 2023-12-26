# permissionless

## 0.0.18

### Patch Changes

- 1371eb5: Added walletClientToCustomSigner

## 0.0.17

### Patch Changes

- 2d7004e: Added support for Biconomy accounts

## 0.0.16

### Patch Changes

- 54ea94e: Update safe module to 2.0

## 0.0.15

### Patch Changes

- 2857b89: Added getRequiredPrefund utility function
- 7c54173: Added support for pm_validateSponsorshipPolicies for pimlicoPaymasterClient

## 0.0.14

### Patch Changes

- 4d6f01f: Add sponsorship policies option to pimlicoPaymasterClient
  Update Safe 4337 module version to 0.2.0
- 5fe172d: Introduce a simpel version of Kernel SmartAccount (by ZeroDev), using their ECDSA Validator

## 0.0.13

### Patch Changes

- 69a7b4b: Added support to enable extra modules and transactions during setup for Safe account
- 639775d: Added support for passing in custom signers
- 0254c24: Enable batch calls for Safe account
- b95e9e5: Enable setting custom nonce for user operations
- 39164f7: Added support for Safe account management

## 0.0.12

### Patch Changes

- aabe479: Added support for SimpleAccount management

## 0.0.11

### Patch Changes

- 5e990c1: Allow using raw accounts with `signUserOperationHashWithECDSA`

## 0.0.10

### Patch Changes

- 565ea3f: Added signUserOperationHashWithECDSA to permissionless utilities

## 0.0.9

### Patch Changes

- 86bd5c1: Fixed support for ESM

## 0.0.8

### Patch Changes

- 09d693d: Added waitForUserOperationReceipt

## 0.0.7

### Patch Changes

- 6f868d8: Added stackup paymaster actions
- 37d2171: Made esm build compatible with Node

## 0.0.6

### Patch Changes

- 4b625b5: Added getAccountNonce

## 0.0.5

### Patch Changes

- 8df3fbd: Added getSenderAddress function

## 0.0.4

### Patch Changes

- 7b3da2d: fix JSDoc links to documentation for actions and getUserOperationHash
- 77e133d: Added `getUserOperationHash`
- e02ebbb: Converted getChainId return type from BigInt to Number

## 0.0.3

### Patch Changes

- 80e7fad: Added Pimlico Bundler Actions (pimlico_getUserOperationStatus, pimlico_getUserOperationGasPrice)
  Added Pimlico Paymaster Actions (pm_sponsorUserOperation)
  Added types for BundlerClient, GetUserOperationByHashParameters, GetUserOperationByHashReturnType, GetUserOperationReceiptParameters, GetUserOperationReceiptReturnType
  Added createBundlerClient, createPimlicoBundlerClient, createPimlicoPaymasterClient
- 3bbc6d3: Fix JSDoc for Bundler Actions, move viem to peerDependencies, and export getUserOperationReceipt

## 0.0.2

### Patch Changes

- 05a12f9: Added Bundler Actions and standard bundler methods support
