# permissionless

## 0.1.31

### Patch Changes

- 588983dda7afaacfb1316fa0688a246f2219e751: Added Trust account support
- c1bf8d72f5492e275bc44544c391cd9fc1e53b62: Added default simple account factory address
- 35c9235e4b53bebeca572007f7822eb96c7dda53: Default timeout for waitForUserOperationReceipt is inherited from bundlerClient.transport
- 7dde111ad35385c3da1db2b09b1e4ffae19c684d: Fixed domain not typed as TypedDataDomain

## 0.1.30

### Patch Changes

- 7f0b5b906b236d8ef0881a06c24462c50995d96b: Improved support for non-EIP1559 networks

## 0.1.29

### Patch Changes

- 5fa31f23672dfb8f6f2ae6f00c16cb6179822970: Made type of waitForUserOperationReceipt.logs consistent with Log from viem

## 0.1.28

### Patch Changes

- 27ac3a7ba8f52653f4704558f1fd89f028e50a96: Fixed types for paymasterActionsEip7677

## 0.1.27

### Patch Changes

- 7d7cc66b6ec55feb2bc5ac5de065020247d14299: Changed signature of paymasterActionsEip7677 to paymasterActionsEip7677(entryPoint)

## 0.1.26

### Patch Changes

- 40cb35dbffc1034df61598adaf5c8320fe4772f3: Loosened the types for 7677 functions

## 0.1.25

### Patch Changes

- be6d2a3d4b394939e3601f12a075bdfe16276dde: Added experimental EIP 7677 support

## 0.1.24

### Patch Changes

- ab93d86ab40b59533653cc1efb6b824683145ee2: Changed LightVersion to LightAccountVersion before release

## 0.1.23

### Patch Changes

- 976884bf550c0ee355974bb8e85a2feb6aa2aaa2: Added Alchemy's LightAccount support v1.1.0

## 0.1.22

### Patch Changes

- 04e34ad51bd8284c18088237d896411e9224510c: Added missing entryPoint, paymaster and reason types in user operation receipt

## 0.1.21

### Patch Changes

- c239d910a48d680823f8712a5a67e117689f907e: Fixed TypedData import from abitype to import from viem

## 0.1.20

### Patch Changes

- 00ecd59fc5915d0667e8f597f9b9537307b6da59: Added Kernel v0.3.0 smart account implementation which is ERC-7579 and EntryPoint v0.7 compliant including relevant testcases

## 0.1.19

### Patch Changes

- 597013e2d08d5ecece99570244e783aba2ef64e9: Added eth_accounts as a fallback in providerToSmartAccountSigner

## 0.1.18

### Patch Changes

- ace8a11af38488a305419e4ea8245eb7890fd5f3: Changed sponsorUserOperation action return type to include maxFeePerGas and maxPriorityFeePerGas if returned by paymaster and return it as part of userOperation from prepareUserOperationRequest action

## 0.1.17

### Patch Changes

- 8652af7665f15e77e65cb62682dd36d8acecc204: Fixed use of BigInt literals for targeting lower than ES2020
- 3651f6c57c2e05aab66967295d1b510ece220949: fix getAction for cases where minifier changes function names

## 0.1.16

### Patch Changes

- 84d841d9f5474c0c5dc806ec6e8177551b2307e8: Added util function getPackedUserOperation

## 0.1.15

### Patch Changes

- 9cb81f6156383381b35753b54adf8c16cc0dba4f: Performance improvement - reduced network call for chain id

## 0.1.14

### Patch Changes

- 7db5e1f99b5e757cfe73962f933a640be7c591b2: Fixed packUserOp when paymaster gas limits are 0

## 0.1.13

### Patch Changes

- 22fadbe5122d8676cc0d2d8b6fd61e90ab516498: Fixed prepareUserOperation when either of paymaster gas limits is zero

## 0.1.12

### Patch Changes

- 9f88457a6458bd10d44241e8d78b2918adbc3042: Added ganache support for getSenderAddress

## 0.1.11

### Patch Changes

- cbe0339486338f001c879e2406399ab845859c84: Added entryPoint 0.7 support for Safe

## 0.1.10

### Patch Changes

- 565e1ffa8645e10f55aea408f642dfd95aef0d04: Fixed signature type issue for typescript 5.2.2 and viem 2.7.8

## 0.1.9

### Patch Changes

- d8b3578ff812f8c63ed8c37ea9468d2cc1b1c9a3: Made signature type explicit to fix type error for biconomy smart account

## 0.1.8

### Patch Changes

- 5743fc2dbf7345af732b91e4c9e7016af09ab8e0: Fix special case for fuse

## 0.1.7

### Patch Changes

- d790f83e2cf05e2bad7c89f87ed4e057bef6322a: Add missing 'types' export in the package.json

## 0.1.6

### Patch Changes

- 68a207f8976a78b8c765dd8b10b105a629c9d4d6: Remove unused `entrypoint` parameter on the method `createSmartAccountClient`

## 0.1.5

### Patch Changes

- b4ee5ecd43bab87a521b6223b9df129ffd0f4e5c: Make smart accounts eip 6492 compliant

## 0.1.4

### Patch Changes

- 850b861cc25a72b06efa1e08c16044fe8f2e2fa6: pimlicoBundlerActions has entryPoint as an input now
- c6f44aa5bc6a5dd85888b17214700f38ef369210: Make fields of userOpeartion v0.7 optional instead of undefined
- 850b861cc25a72b06efa1e08c16044fe8f2e2fa6: Fix source types for safe accounts
- 4392ac82d56325e7584b0cd48edb4e99081aa085: Fix signer types

## 0.1.3

### Patch Changes

- 5e935d0b1ae3ccee546800e0536e8d48746cb416: Fix SponsorUserOperationReturnType with no undefined values
- b173cf9d5f32e480b2209483968536c231bebb25: Remoive entryPoint params when calling sponsorUserOperation from client

## 0.1.2

### Patch Changes

- 29773d05b0bae60266f2989bc1c1ed9fee688dc9: change providerToSmartAccountSigner signature

## 0.1.1

### Patch Changes

- 2b2c29026cd593fd4f887c8f8340a6eb0d2b94b9: fix prepareUserOperationRequest for entryPoint 0.7

## 0.1.0

### Minor Changes

- be2929a3ad655475510e136c4289269b86ce0714: Add EntryPoint v0.7 support
- f860a3a0678418b820a84e222f444f5bd21f1782: providerToSmartAccountSigner accepts keyword args
- dcf9d9dc5b018742ef93827974a67b77cc2cf702: Add support for middleware in createSmartAccountClient

## 0.0.36

### Patch Changes

- 049a82c05d946b308849877b941e4b03baf0ec62: Safe accounts will revert with error string if calldata reverts

## 0.0.35

### Patch Changes

- 17ba362046c66642e908b7f8af0d0b4b4ef16de1: Added account parameters types

## 0.0.34

### Patch Changes

- 76c4031e4d5e42fd8ceadf7ed96ba55d2bf4ea06: Remove imports from abitype and move them to viem, fixes: issue#105

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
