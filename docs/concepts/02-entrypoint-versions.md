# EntryPoint Versions

The ERC-4337 EntryPoint contract has evolved through three major versions. permissionless supports all three, with version 0.7 as the default.

## Version Comparison

### UserOperation Fields

| Field | 0.6 | 0.7 | 0.8 |
|-------|-----|-----|-----|
| `sender` | Address | Address | Address |
| `nonce` | uint256 | uint256 | uint256 |
| `initCode` | bytes (factory + factoryData combined) | -- | -- |
| `factory` | -- | address | address |
| `factoryData` | -- | bytes | bytes |
| `callData` | bytes | bytes | bytes |
| `callGasLimit` | uint256 | uint128 | uint128 |
| `verificationGasLimit` | uint256 | uint128 | uint128 |
| `preVerificationGas` | uint256 | uint256 | uint256 |
| `maxFeePerGas` | uint256 | uint128 | uint128 |
| `maxPriorityFeePerGas` | uint256 | uint128 | uint128 |
| `paymasterAndData` | bytes (combined) | -- | -- |
| `paymaster` | -- | address | address |
| `paymasterVerificationGasLimit` | -- | uint128 | uint128 |
| `paymasterPostOpGasLimit` | -- | uint128 | uint128 |
| `paymasterData` | -- | bytes | bytes |
| `signature` | bytes | bytes | bytes |
| `authorization` | -- | -- | bytes (EIP-7702) |

**Key change from 0.6 to 0.7:** The combined `initCode` (factory+data) and `paymasterAndData` (paymaster+data) fields were split into separate typed fields, improving type safety and gas accounting.

**Key change from 0.7 to 0.8:** Added the `authorization` field for EIP-7702 EOA delegation, and switched to EIP-712 typed data signing.

### Signing Method

| Version | Method | Details |
|---------|--------|---------|
| 0.6 | Hash-based | `keccak256(abi.encode(userOpHash, entryPoint, chainId))` |
| 0.7 | Hash-based | `keccak256(abi.encode(userOpHash, entryPoint, chainId))` |
| 0.8 | EIP-712 typed data | Uses `getUserOperationTypedData` from viem for structured signing |

### Batch Execution ABI

Different account implementations use different batch execution ABIs depending on EntryPoint version:

**Simple Account:**
- 0.6: `executeBatch(address[] dest, bytes[] func)`
- 0.7: `executeBatch(address[] dest, uint256[] value, bytes[] func)`
- 0.8: `executeBatch((address target, uint256 value, bytes data)[] calls)`

### Gas Model

| Field | 0.6 | 0.7 / 0.8 |
|-------|-----|-----------|
| `callGasLimit` | uint256 | uint128 |
| `verificationGasLimit` | uint256 | uint128 |
| `preVerificationGas` | uint256 | uint256 |
| `maxFeePerGas` | uint256 | uint128 |
| `maxPriorityFeePerGas` | uint256 | uint128 |
| Paymaster verification gas | Included in `paymasterAndData` | Separate `paymasterVerificationGasLimit` |
| Paymaster post-op gas | Included in `paymasterAndData` | Separate `paymasterPostOpGasLimit` |

The `getRequiredPrefund()` utility computes the minimum deposit needed, using version-specific formulas:

- **0.6:** `(callGasLimit + verificationGasLimit * 3 + preVerificationGas) * maxFeePerGas`
- **0.7/0.8:** `(callGasLimit + verificationGasLimit + paymasterVerificationGasLimit + paymasterPostOpGasLimit + preVerificationGas) * maxFeePerGas`

### EntryPoint Addresses

| Version | Address |
|---------|---------|
| 0.6 | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` |
| 0.7 | `entryPoint07Address` from viem (`0x0000000071727De22E5E9d8BAf0edAc6f37da032`) |
| 0.8 | `entryPoint08Address` from viem |

## Default Version

When `entryPoint` is not specified:
- **Smart account factories** default to EntryPoint 0.7
- **`createPimlicoClient`** defaults to EntryPoint 0.7 (`entryPoint07Address`)
- **EIP-7702 accounts** require EntryPoint 0.8 (always)

## Version Selection

To use a specific EntryPoint version, pass the `entryPoint` parameter:

```typescript
import { entryPoint07Address } from "viem/account-abstraction"

// Smart account with EntryPoint 0.7 (default)
const account = await toSimpleSmartAccount({
    client: publicClient,
    owner,
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})

// Pimlico client with specific EntryPoint
const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
    },
})
```

## Account Support Matrix

| Account | 0.6 | 0.7 | 0.8 |
|---------|-----|-----|-----|
| Simple | Yes | Yes | Yes |
| Simple (7702) | -- | -- | Yes |
| Safe | Yes (v1.4.1) | Yes (v1.5.0) | -- |
| Kernel | Yes | Yes | -- |
| ECDSA Kernel | Yes | Yes | -- |
| Kernel (7702) | -- | -- | Yes |
| Light | Yes (v1.1.0) | Yes (v2.0.0) | -- |
| Biconomy | -- | Yes | -- |
| Trust | -- | Yes | -- |
| Etherspot | -- | Yes | -- |
| Nexus | -- | Yes | -- |
| Thirdweb | -- | Yes | -- |
