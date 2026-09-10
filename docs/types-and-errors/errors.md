# Errors

Every public throw in permissionless is a named class extending viem 3's `Errors.BaseError`, so `instanceof Errors.BaseError` holds and `error.walk()` works across viem, ox and permissionless. Classes live in `errors/<module>.ts` and are exported flat from the package root.

```typescript
import { Errors } from "viem"
import { EmptyCallsError } from "permissionless"

try {
    await account.encodeCalls([])
} catch (error) {
    if (error instanceof EmptyCallsError) console.error(error.name) // "EmptyCallsError"
    if (error instanceof Errors.BaseError) console.error(error.shortMessage)
}
```

`error.name` equals the class name. Constructors take a single options object where they carry data.

## Shared

| Class | Thrown by | Replaces (0.x) |
| --- | --- | --- |
| `AccountNotFoundError` | every smart-account, ERC-7579 and ERC-20 paymaster action when neither the client nor the parameters carry an account | same class (moved from `errors/index.ts` to `errors/account.ts`); `Error("Account not found")` in the ERC-20 paymaster hook |
| `EmptyCallsError` | `encodeCalls([])` on every account; `Erc7579.encodeCalls` | `Error("No calls to encode")`; the per-account `SafeNoCallsError`, `SimpleAccountEmptyCallsError`, `LightSmartAccountEmptyCallsError`, `TrustEmptyCallsError`, `ThirdwebNoCallsError`, `KernelEmptyCallsError` drafted during the 1.0 ports |
| `TransactionToRequiredError` | `sendTransaction` without `to` | `Error("Missing to address")` |

## EntryPoint (`getSenderAddress`)

| Class | Thrown by | Replaces (0.x) |
| --- | --- | --- |
| `InitCodeRequiredError` | neither `initCode` nor `factory` + `factoryData` given | `Error("Either \`initCode\` or \`factory\` and \`factoryData\` must be provided")` |
| `InvalidEntryPointError` | the helper call reverts because `entryPointAddress` did not revert with `SenderAddressResult`; `cause` is viem's call error | same class, previously exported but never thrown |
| `SenderAddressNotFoundError` | the helper call returned no data | `Error("Failed to get sender address")` |

## Owner (`Owner.from`)

| Class | Thrown by | Replaces (0.x) |
| --- | --- | --- |
| `OwnerAddressRequiredError` | an EIP-1193 provider returned no accounts and `address` was not given | `Error("address is required")` |
| `OwnerSignUnsupportedError` | `sign` (and the derived `signTransaction`) on an owner built from a wallet client or provider | `Error("Smart account signer doesn't sign raw hashes")`, `Error("Smart account signer doesn't need to sign transactions")` |

## ERC-7579

| Class | Thrown by | Replaces (0.x) |
| --- | --- | --- |
| `Erc7579InvalidCallTypeError` | `Erc7579.decodeCalls` on an unknown call-type byte | `Error("Invalid call type")` |
| `Erc7579InvalidExecutionModeError` | `Erc7579.encodeCalls` with several calls but a non-`batchcall` mode | `Error("mode … does not supported for batchcall calldata")` |
| `Erc7579InvalidModuleTypeError` | `Erc7579.supportsModule` / `isModuleInstalled` with an unknown module type | `Error("Invalid module type")` |
| viem `ContractError.ContractFunctionZeroDataError` | the counterfactual `eth_call` fallback in `accountId`, `isModuleInstalled`, `supportsExecutionMode`, `supportsModule` returned no data | `Error("accountId result is empty")` |

## ERC-20 paymaster

| Class | Thrown by | Replaces (0.x) |
| --- | --- | --- |
| `TokenQuoteNotFoundError` | `Erc20Paymaster.estimateCost` and `Erc20Paymaster.prepareUserOperation` when `pimlico_getTokenQuotes` returns no quote for the token | `Error("No token quote found for …")`, bare `BaseError("client didn't return token quotes …")` |
| `BalanceSlotRequiredError` | `Erc20Paymaster.prepareUserOperation` with `balanceOverride: true` and no known balance slot | `Error("balanceOverride is not supported for token …")` |
| `Erc20PaymasterRequiredError` | `Erc20Paymaster.prepareUserOperation` without a paymaster on the client or the call | `Error("Expected paymaster: cannot sponsor ERC-20 without paymaster")` |
| viem `Chain.NotFoundError` | `estimateCost` / `getTokenQuotes` without a chain | same viem class |

## Passkey server

| Class | Thrown by | Replaces (0.x) |
| --- | --- | --- |
| `InvalidPasskeyServerResponseError` | every `pks_*` action when the server response fails validation; `metaMessages` carries the reason | ten `Error("Invalid … returned from server")` variants |
| `InvalidPasskeyCredentialError` | `verifyAuthentication` when the WebAuthn response lacks `authenticatorData` or `signature` | `Error("… not found in the signature")` |
| `PasskeyAttestationUnsupportedError` | `verifyRegistration` when `getPublicKeyAlgorithm()` / `getAuthenticatorData()` throw; `cause` is the browser error | `Error("… is not supported")` |

## Accounts

Each account's own failures keep their class from the port (see the account pages): `EtherspotNonceKeyOverflowError`; `KernelUnsupportedVersionError`, `KernelValidatorAddressRequiredError`, `KernelNonceKeyTooLargeError`, `KernelDecodeCallsError`, `InvalidKernelAccountError`; `LightSmartAccountUnsupportedVersionError`; `SafeEntryPointVersionUnsupportedError`, `SafeWebAuthnSharedSignerAddressMissingError`, `SafeInvalidOwnerError`, `SafeInsufficientOwnersError`, `SafeErc7579VersionUnsupportedError`, `SafeSenderRequiredError`, `SafeInvalidWebAuthnClientDataError`, `SafeInvalidSignatureError`; `SimpleAccountErc1271UnsupportedError`, `SimpleAccountFactoryAddressRequiredError`; `TrustInvalidCallDataError`. Nexus throws nothing of its own.

## Tests

`errors/index.test.ts` constructs every exported class and asserts the table covers the whole flat export, so adding a class without a table row fails the suite.
