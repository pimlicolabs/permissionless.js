# EntryPoint Versions

The ERC-4337 EntryPoint contract has four versions. permissionless supports all of them; which one an account defaults to depends on the account.

## Version Comparison

### UserOperation Fields

| Field | 0.6 | 0.7 | 0.8 / 0.9 |
|-------|-----|-----|-----------|
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
| `authorization` | -- | -- | EIP-7702 authorization |

**0.6 to 0.7:** the combined `initCode` and `paymasterAndData` fields were split into typed fields.

**0.7 to 0.8:** the `authorization` field for EIP-7702 delegation and EIP-712 typed-data signing of the UserOperation. viem types 0.9 with the same shape as 0.8 (`UserOperation.UserOperation<"0.8" | "0.9">`).

### Signing Method

| Version | Method | Details |
|---------|--------|---------|
| 0.6 | Hash-based | `keccak256(abi.encode(userOpHash, entryPoint, chainId))`, `UserOperation.hash` |
| 0.7 | Hash-based | same |
| 0.8, 0.9 | EIP-712 typed data | `UserOperation.toTypedData` (viem) |

### Batch Execution ABI

Account implementations use different batch ABIs per EntryPoint version. SimpleAccount:
- 0.6: `executeBatch(address[] dest, bytes[] func)`
- 0.7: `executeBatch(address[] dest, uint256[] value, bytes[] func)`
- 0.8, 0.9: `executeBatch((address target, uint256 value, bytes data)[] calls)`

### Gas Model

| Field | 0.6 | 0.7+ |
|-------|-----|------|
| `callGasLimit` | uint256 | uint128 |
| `verificationGasLimit` | uint256 | uint128 |
| `preVerificationGas` | uint256 | uint256 |
| `maxFeePerGas` | uint256 | uint128 |
| `maxPriorityFeePerGas` | uint256 | uint128 |
| Paymaster verification gas | Inside `paymasterAndData` | `paymasterVerificationGasLimit` |
| Paymaster post-op gas | Inside `paymasterAndData` | `paymasterPostOpGasLimit` |

`getRequiredPrefund` computes the minimum deposit with the version-specific formula:

- **0.6:** `(callGasLimit + verificationGasLimit * m + preVerificationGas) * maxFeePerGas`, `m = 3` with a paymaster and `1` without
- **0.7+:** `(callGasLimit + verificationGasLimit + paymasterVerificationGasLimit + paymasterPostOpGasLimit + preVerificationGas) * maxFeePerGas`

### EntryPoint Addresses

viem exports the canonical addresses and ABIs from `viem/erc4337`:

| Version | Address | viem constants |
|---------|---------|----------------|
| 0.6 | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | `EntryPoint.addressV06`, `EntryPoint.abiV06` |
| 0.7 | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | `EntryPoint.addressV07`, `EntryPoint.abiV07` |
| 0.8 | `EntryPoint.addressV08` | `EntryPoint.addressV08`, `EntryPoint.abiV08` |
| 0.9 | `EntryPoint.addressV09` | `EntryPoint.addressV09`, `EntryPoint.abiV09` |

## Default Version

When `entryPoint` is omitted:

- **Simple** defaults to 0.8
- **Safe, Kernel, Light, Thirdweb, Nexus, Etherspot** default to 0.7
- **Trust** is 0.6 only
- **`PimlicoClient.create`** defaults to 0.7
- **EIP-7702 mode:** Simple on 0.8 (or 0.9), Kernel on 0.7

The defaults are frozen for the 1.x line: omitting `entryPoint` derives the same address as passing the default explicitly.

## Version Selection

`entryPoint` takes the version shorthand or an explicit `{ address, version }` (for a custom deployment):

```typescript
import { EntryPoint } from "viem/erc4337"
import { SimpleSmartAccount } from "permissionless"
import { PimlicoClient } from "permissionless/pimlico"

// Shorthand: canonical address for the version
const account = await SimpleSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: "0.7"
})

// Explicit address
const account2 = await SimpleSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
})

// Pimlico client (object form only)
const pimlicoClient = PimlicoClient.create({
    transport: http(pimlicoUrl),
    entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
})
```

## Account Support Matrix

| Account | 0.6 | 0.7 | 0.8 | 0.9 |
|---------|-----|-----|-----|-----|
| Simple | Yes | Yes | Yes (default) | Yes (`factoryAddress` required) |
| Simple (EIP-7702) | -- | -- | Yes | Yes |
| Safe | Yes (1.4.1) | Yes (1.4.1, 1.5.0) | -- | -- |
| Kernel | Yes (0.2.x) | Yes (0.3.x) | -- | -- |
| Kernel (EIP-7702) | -- | Yes (0.3.3) | -- | -- |
| Light | Yes (1.1.0) | Yes (2.0.0) | -- | -- |
| Trust | Yes | -- | -- | -- |
| Etherspot | -- | Yes | -- | -- |
| Nexus | -- | Yes | -- | -- |
| Thirdweb | Yes | Yes | -- | -- |
