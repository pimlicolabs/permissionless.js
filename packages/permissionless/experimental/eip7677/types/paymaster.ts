import type { Hex } from "viem"
import type {
    EntryPoint,
    GetEntryPointVersion
} from "../../../types/entrypoint"
import type { UserOperationWithBigIntAsHex } from "../../../types/userOperation"

export type GetRpcPaymasterStubDataParameters<entryPoint extends EntryPoint> = [
    userOperation: UserOperationWithBigIntAsHex<
        GetEntryPointVersion<entryPoint>
    >,
    entryPoint: entryPoint,
    chainId: Hex,
    context?: Record<string, unknown>
]

export type GetRpcPaymasterStubDataReturnType<entryPoint extends EntryPoint> =
    GetEntryPointVersion<entryPoint> extends "v0.6"
        ? {
              paymasterAndData: Hex
          }
        : {
              paymaster: Hex
              paymasterData: Hex
              paymasterVerificationGasLimit?: Hex | null
              paymasterPostOpGasLimit?: Hex | null
          }

export type GetRpcPaymasterDataParameters<entryPoint extends EntryPoint> = [
    userOperation: UserOperationWithBigIntAsHex<
        GetEntryPointVersion<entryPoint>
    >,
    entryPoint: entryPoint,
    chainId: Hex,
    context?: Record<string, unknown>
]

export type GetRpcPaymasterDataReturnType<entryPoint extends EntryPoint> =
    GetEntryPointVersion<entryPoint> extends "v0.6"
        ? {
              paymasterAndData: Hex
          }
        : {
              paymaster: Hex
              paymasterData: Hex
          }

export type Eip7677RpcSchema<entryPoint extends EntryPoint> = [
    {
        Method: "pm_getPaymasterStubData"
        Parameters: GetRpcPaymasterStubDataParameters<entryPoint>
        ReturnType: GetRpcPaymasterStubDataReturnType<entryPoint>
    },
    {
        Method: "pm_getPaymasterData"
        Paremeters: GetRpcPaymasterDataParameters<entryPoint>
        ReturnType: GetRpcPaymasterDataReturnType<entryPoint>
    }
]
