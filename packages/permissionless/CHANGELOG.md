# permissionless

## 0.0.33

### Patch Changes

- 14e2feed006653892f76548ae4e38f3ed5a1a948: Renamed walletClientToCustomSigner to walletClientToSmartAccountSigner
- 14e2feed006653892f76548ae4e38f3ed5a1a948: Added providerToSmartAccountSigner
- 14e2feed006653892f76548ae4e38f3ed5a1a948: Use tsc-alias to resolve full paths

## 0.0.32

### Patch Changes

- 57dd176305078ab121e0289cdf6566dd063ca0e4: Added custom error types corresponding to AA errors

## 0.0.31

### Patch Changes

- 3917ad1acfb6ac7f45da7f74e277a22bcf24231b: fix isSmartAccountDeployed

## 0.0.30

### Patch Changes

- 1069679230b07113a993927dd453d5eca4d94bc5: Added support for sendCompressedUserOperation Pimlico bundler action

## 0.0.29

### Patch Changes

- 4de179a0d49f23b5961b84b6ccba56f0f7cde345: Enable state overrides during estimation

## 0.0.28

### Patch Changes

- 341b5948b44e22cd9b3dcdfd1449a76c45530d2d: Add ability to pass deployed account address to signer\*\*Account actions

## 0.0.27

### Patch Changes

- ee5e795d9fcbdc0e33afd608faff14814055e4a6: 1. Account type for smartAccountCLient will be inferred automatically, so you will not have to pass `account` everywhere in functions like `sendTransaction` 2. Switching tests to vitest to enable type testing for better types in future 3. Better types for all the actions, we prettify all the args & return types

## 0.0.26

### Patch Changes

- e290cf7: Fix type for createSmartAccountClient

## 0.0.25

### Patch Changes

- fd1292a: Send delegatecall to multisend safe

## 0.0.24

### Patch Changes

- f705bef: clear setTimeout

## 0.0.23

### Patch Changes

- 9c28e23: clear interval and unobserve on timeout in waitForUserOperationReceipt

## 0.0.22

### Patch Changes

- 975b1f5: Fix potential memoryLeak in waitForUserOperationReceipt
- 6799f81: Add sponsorship to prepareUserOperation

## 0.0.21

### Patch Changes

- 3f48e11: Upgrade to viem ^2.0.0

## 0.0.20

### Patch Changes

- c404bb0: Export sendUserOperation from smartAccountClient

## 0.0.19

### Patch Changes

- 7c68b39: Export all actions, sponsorUserOperation now returns complete UserOperation, we pass userOperation to getDummySignature

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
