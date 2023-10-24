# permissionless

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
