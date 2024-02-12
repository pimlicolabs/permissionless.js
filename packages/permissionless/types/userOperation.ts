import type { Address } from "viem"
import type { Hex } from "viem"
import type {
    DefaultEntryPoint,
    EntryPointVersion,
    GetEntryPointVersion
} from "./entrypoint"

export type TStatus = "success" | "reverted"

export type UserOperationWithBigIntAsHex<
    entryPointVersion extends
        EntryPointVersion = GetEntryPointVersion<DefaultEntryPoint>
> = entryPointVersion extends "0.6"
    ? {
          sender: Address
          nonce: Hex
          initCode: Hex
          callData: Hex
          callGasLimit: Hex
          verificationGasLimit: Hex
          preVerificationGas: Hex
          maxFeePerGas: Hex
          maxPriorityFeePerGas: Hex
          paymasterAndData: Hex
          signature: Hex
          factory?: never
          factoryData?: never
          paymaster?: never
          paymasterVerificationGasLimit?: never
          paymasterPostOpGasLimit?: never
          paymasterData?: never
      }
    : {
          sender: Address
          nonce: Hex
          factory: Address
          factoryData: Hex
          callData: Hex
          callGasLimit: Hex
          verificationGasLimit: Hex
          preVerificationGas: Hex
          maxFeePerGas: Hex
          maxPriorityFeePerGas: Hex
          paymaster: Address
          paymasterVerificationGasLimit: Hex
          paymasterPostOpGasLimit: Hex
          paymasterData: Hex
          signature: Hex
          initCode?: never
          paymasterAndData?: never
      }

export type UserOperation<
    entryPointVersion extends
        EntryPointVersion = GetEntryPointVersion<DefaultEntryPoint>
> = entryPointVersion extends "0.6"
    ? {
          sender: Address
          nonce: bigint
          initCode: Hex
          callData: Hex
          callGasLimit: bigint
          verificationGasLimit: bigint
          preVerificationGas: bigint
          maxFeePerGas: bigint
          maxPriorityFeePerGas: bigint
          paymasterAndData: Hex
          signature: Hex
          factory?: never
          factoryData?: never
          paymaster?: never
          paymasterVerificationGasLimit?: never
          paymasterPostOpGasLimit?: never
          paymasterData?: never
      }
    : {
          sender: Address
          nonce: bigint
          factory?: Address
          factoryData?: Hex
          callData: Hex
          callGasLimit: bigint
          verificationGasLimit: bigint
          preVerificationGas: bigint
          maxFeePerGas: bigint
          maxPriorityFeePerGas: bigint
          paymaster?: Address
          paymasterVerificationGasLimit?: bigint
          paymasterPostOpGasLimit?: bigint
          paymasterData?: Hex
          signature: Hex
          initCode?: never
          paymasterAndData?: never
      }
