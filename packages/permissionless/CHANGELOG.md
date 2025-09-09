# permissionless

## 0.2.57

### Patch Changes

- e11c977481d98749a97526c063839cf014d69bf8: Added ability to overwrite accountLogicAddress for eip7702 kernel smart account
- d2a7a3ed0c09a85a52dd74919dbae32f70c60fd2: Updated ox dependency

## 0.2.56

### Patch Changes

- 6ba059a8643cd9efba0e0753e316d6919e5412fc: Added 1271 support for kernel 0.3.3 + 7702 post delegation

## 0.2.55

### Patch Changes

- f43c30c360608b198502796bcfd87f12f9107574: Added support for sendCalls & getCallsStatus for smart account client

## 0.2.54

### Patch Changes

- 29ac0341359235ce4ad78f167df5fedb87022b9f: Added passkeys support for all Safe versions and entrypoint 0.7 & 0.8

## 0.2.53

### Patch Changes

- bd19b74e0d6d54e24b37546de05268d5e7b16c45: Added support for safe 1.5.0

## 0.2.52

### Patch Changes

- 0d82154a74d4592da9fb014d56567f9ff884fc81: Fixed owners length check for safe multisig

## 0.2.51

### Patch Changes

- 1f3c2d2ff753e91ff11d587bb1758b5d65fea8f9: Fixed multi-sig safe when threshold is not same as owners

## 0.2.50

### Patch Changes

- ba0e2bd161d5ee4bbd975a28f9f36ff520aca8f7: Added estimateErc20PaymasterCost

## 0.2.49

### Patch Changes

- be0db9bf8da4fdd3fd993626991121381d21e9ce: Removed fixed ox version as optional dependency

## 0.2.48

### Patch Changes

- 56fdf93fca1a7e173c1f34352a93bdc102f0563c: Added authorisation support for installModule and installModules
- 52a3de159521bb98585cad16697fdd871e83b209: Added to7702SimpleSmartAccount
- 5494e69866df60ee87424a51d6f99c4e76eaa7d6: Added to7702KernelSmartAccount

## 0.2.47

### Patch Changes

- ad6fc0eadc2c7ebb93b097ced501922947b71984: Fixed threshold for safe

## 0.2.46

### Patch Changes

- bdf11dfb49a872d9a89580b7f8607fbcfcc5a238: Added SimpleAccount 0.8

## 0.2.45

### Patch Changes

- 28c248502253929c5542876f5f8bf21f1c4c1e69: Forward all args to sendUserOperation action

## 0.2.44

### Patch Changes

- 576a63439dd2b72e21edf480be7fd4458e08c4ba: Added validForSeconds field to pm_sponsorUserOperation, removed deprecated label on pm_sponsorUserOperation

## 0.2.43

### Patch Changes

- e050d86574791b210d9de183e85281bbdfe4e498: Added support for kernel 0.3.2 & 0.3.3

## 0.2.42

### Patch Changes

- d9ec1ec588781684d1cd2d6aeec1c9dc73ac4aa8: Added return of userName for passkeys verification actions

## 0.2.41

### Patch Changes

- 3e413ee36e89b8c055d504403776c9868cb598e4: Added optional value to useMetaFactory

## 0.2.40

### Patch Changes

- 9448c6fc5275f4be21916cb9f91dc067452baa6b: Added passkeys authentication flow

## 0.2.39

### Patch Changes

- f0070a5e6be409f1f8a250d3bfc36324bc33f9c3: Updated GetSenderAddressHelper.sol to return abi encoded address (fixes edgecase when sender starts with 0xef...)

## 0.2.38

### Patch Changes

- 97f1ba07b3dd6b2dd4b1622aed2e06c80cde0b59: Added flow to handle USDT approval flow on mainnet in prepareUserOperationForErc20Paymaster

## 0.2.37

### Patch Changes

- da27fd39cb0baecc5bc7a33f1a4da7150d05ba17: Removed allowance override in prepareUserOperationForErc20Paymaster

## 0.2.36

### Patch Changes

- 58f1e783d67e5021caef58582953b5146f0328b5: Fixed sorting of attesters for safe and nexus

## 0.2.35

### Patch Changes

- e46dbdb8d55613ee348ea8f562c4a1ae7501c243: Added support for passkey server

## 0.2.34

### Patch Changes

- caced42687f2de9950938be64af65089f9c0f6c7: Deprecated toSafeSmartAccount's setupTransactions field
- caced42687f2de9950938be64af65089f9c0f6c7: Added onchainIdentier param for toSafeSmartAccount

## 0.2.33

### Patch Changes

- cdf7b2ba79f9ff50192a2084140dd13ff5118774: Added support for decode calls in prepareUserOperationForErc20Paymaster

## 0.2.32

### Patch Changes

- 49e634973da560ca0e6fe333fce125fda7c96ec3: Fixed signTypedData for safe 7579 when deployed

## 0.2.31

### Patch Changes

- bfa8da45e85b2481405f1349b5553ea86b04647b: Fixed signMessage for safe 7579 when deployed

## 0.2.30

### Patch Changes

- aa813f670cdae435f83594a78050861fa55b15bf: Fixed support viem>=2.21.59

## 0.2.29

### Patch Changes

- d3f92b923432051c978d4fcbf1675b7b49a01c74: Added support for EthereumProvider in safe

## 0.2.28

### Patch Changes

- 496e975f705e1d75bb38009512ed38daceae5d62: Deprecated pimlico_sendCompressedUserOperation

## 0.2.27

### Patch Changes

- 0c2d20fa944ac00c9f9eda242d32dc04c9091fe8: Added decode calls function to all smart accounts

## 0.2.26

### Patch Changes

- 86dc887aa1c3c5990751b5ed7d4237fc4ee0afbc: Added useMetaFactory flag for toEcdsaKernelSmartAccount

## 0.2.25

### Patch Changes

- 35418aeccd0cca9a3b6ff067158fcb5fd5548d42: Fixed `signUserOperation` for `toSafeSmartAccount` when owner is not a LocalAccount.

## 0.2.24

### Patch Changes

- 30c73e027c5966cb23b3a5d74454d473627098c3: Added support for multi-sig in Safe

## 0.2.23

### Patch Changes

- aa7850385a016a1f964639e292f8844929fc16a9: Added support for Etherspot Smart Account

## 0.2.22

### Patch Changes

- fb7be6286b2023b20ff9951d5c602eaa2f589e3f: Added toKernelSmartAccount with passkeys support
- fb7be6286b2023b20ff9951d5c602eaa2f589e3f: Depricated toEcdsaKernelSmartAccount

## 0.2.21

### Patch Changes

- 41e3a2b8258b1770a3d81fba1c949fe194965c47: Fixed use of getPaymasterData twice in prepareUserOperationForErc20Paymaster

## 0.2.20

### Patch Changes

- 4ad2c5a1acdbd385ba1737752b7e0795b95e2d56: Downgraded GetSenderAddressHelper bytecode to london EVM version

## 0.2.19

### Patch Changes

- f82cd134ae25ec871318cfb698b10130c24dc94b: Fixed typescript error to name all tuple members

## 0.2.18

### Patch Changes

- b23471a3daa08cda57d09366c01356f38564fd7a: Added thirdweb factory version

## 0.2.17

### Patch Changes

- 7ad534ed914b53e595844ca029afd0c8a0377e56: Fixed signMessage & signTypeData for Kernel version 0.2.3 and 0.2.4

## 0.2.16

### Patch Changes

- a0730b515bf9e8b21dcfecfad546f41619f5eabe: Upgraded moduleResolution to nodenext for esm & types build
- 22de50df7305dd59301e7b4511b63abffc857daa: Improved `getSenderAddress` to avoid relying on EntryPoint reverts with RPC.

## 0.2.15

### Patch Changes

- fc37a3e023b8a279de2eb09c50cdf4f46aa94e8c: Fixed ethereum provider by changing type of EIP1193Provider to EthereumProvider

## 0.2.14

### Patch Changes

- d58a8aa474e6a6d717f3623833e0cf5489d1c46f: Added support for Biconomy's Nexus account
- b293e3e97749e4382628f1b4d9d2e34a0b493c59: Fixed support for latest audited 7579 contracts

## 0.2.13

### Patch Changes

- 25ee9a9c56a99bd3aa5bc0b079e478e3617be542: Fixed when slot overrides returned from pimlico_getTokenQuotes are zero

## 0.2.12

### Patch Changes

- 6a7b673f66565b5d0d6d2fe1fe17e7758975a624: Fixed when slot overrides returned from pimlico_getTokenQuotes are zero

## 0.2.11

### Patch Changes

- bfc278b5cc3d8e6536d84005cc94e55e3c99eb9d: Added utils to create erc20 state overrides
- bfc278b5cc3d8e6536d84005cc94e55e3c99eb9d: Added balanceOverride to prepareUserOperationForErc20Paymaster

## 0.2.10

### Patch Changes

- 31cedea722382daa12f1d2c6dd70ab54b38deca1: Added getSenderAddress to support for more RPCs.

## 0.2.9

### Patch Changes

- 0af2b590861915f806098b83c8f8159b33923bb7: Added support for thirdweb smart account

## 0.2.8

### Patch Changes

- fda964a92d87ed6e141dc1a82cd39ecc4e682e4d: Added support for eth_call returning code -32000 for sender address calculation

## 0.2.7

### Patch Changes

- e8d4f350c6c754ce4c9c4ed06af13dab0c1a5cc7: Fix: Biconomy sender address calculation post deploy

## 0.2.6

### Patch Changes

- 9c27191bdde4bc534732487ddc27f9f2d8e5be1d: Added prepareUserOperationForErc20Paymaster under pimlico/experimental

## 0.2.5

### Patch Changes

- b09bb1cf484b4b2af9df35c5e6cc2a5d0a371050: Forwarded the client for fees estimation

## 0.2.4

### Patch Changes

- 7d4602c831430744916dda33983be0583d9b0662: Added utility functions to encode 7579 function calldata
- d23ee0d5b530134756ea098f6233910f79cba83e: Added support to send calls with 7579 functions and override paymaster props
- d23ee0d5b530134756ea098f6233910f79cba83e: Added support for initData & deInitData

## 0.2.3

### Patch Changes

- 80176c6b99c3406d23bdf230f6c33b8e0e34bbb9: Fixed - give priority to nonceKey passed in parameters

## 0.2.2

### Patch Changes

- 6cfab3199c3f5a8bf5301b932d8175cfef620a17: Added exchangeRateNativeToUsd field to pimlico_getTokenQuotes return type

## 0.2.1

### Patch Changes

- de9e50a460ef690b3fff3b0764c2fde998646081: Fixed: type checks before encoding calldata

## 0.2.0

### Minor Changes

- 2e4d504c12dbb4af6eeccc9b62648cae60193424: permissionless.js 0.2.0 released. Migration guide - https://docs.pimlico.io/permissionless/how-to/migration-guide

## 0.1.45

### Patch Changes

- b045fb4b20610c72138b85208977be7de9984ec7: Added support for paymentToken, payment and paymentReceiver in Safe smart account

## 0.1.44

### Patch Changes

- fa011a17578dc2a4d35cb97116571e098a8dca09: Added support for extending the type of chain passed

## 0.1.43

### Patch Changes

- 89a42e1d8b61c49c8795c71c12487f91f64abbc3: Fixed Kernel 0.3.1 address calculation
- 89a42e1d8b61c49c8795c71c12487f91f64abbc3: Added installModules & uninstallModules export

## 0.1.42

### Patch Changes

- a41a84c4232ceec6e5c0544200a2d1cba241cd08: Added uninstall modules and install modules functions

## 0.1.41

### Patch Changes

- 299513dfee5054a3d59591f4bf11cb145783988d: Added decodeNonce util function

## 0.1.40

### Patch Changes

- be1c3dede45bdfbffe168735cbd48fd967684818: Added encodeNonce util function

## 0.1.39

### Patch Changes

- 3527daa505b73b343cbee257124d5416b7dff730: Fixed getSenderAddress, when rpc returns an UnknownRpcError

## 0.1.38

### Patch Changes

- 71740c2d9a3fbb289df277831bde10b33995d9df: Fixed batchcall for 7579 accounts

## 0.1.37

### Patch Changes

- 75f48b038f2c0943c1df3e0aa693a641fb4be941: Fixed typo erc7569 > erc7579.

## 0.1.36

### Patch Changes

- f3b5d5e65c34479c8b7a3e59d96fd3fb8bc4933c: Made ExecutionMode fields optional

## 0.1.35

### Patch Changes

- d986d6987d94d0a3cdf46126eac170fdb8994dd1: Added Erc7677 upgrade to include sponsor & isFinal in paymaster stub data.

## 0.1.34

### Patch Changes

- 133de34e2a8140879caba4d108e6910ffb38d807: Fixed erc7579Actions export

## 0.1.33

### Patch Changes

- 3e1ff32f3b99e22b957a05abe34ecf22d30112b8: Added support for parsing revert data from kakarot, rootstock-testnet & fuse to "getSenderAddress"

## 0.1.32

### Patch Changes

- d7f7f0de2dfc683352a6ec91a96fc2621d37e835: Added 7579 actions support

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
