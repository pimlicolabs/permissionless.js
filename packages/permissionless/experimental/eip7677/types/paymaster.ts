import type { Address, Hex, OneOf } from "viem"
import type { UserOperation } from "viem/account-abstraction"

export type GetRpcPaymasterStubDataParameters<
    entryPointVersion extends "0.6" | "0.7"
> = [
    userOperation: UserOperation<entryPointVersion, Hex>,
    entryPoint: Address,
    chainId: Hex,
    context?: Record<string, unknown>
]

export type GetRpcPaymasterStubDataReturnType<
    entryPointVersion extends "0.6" | "0.7"
> = OneOf<
    | (entryPointVersion extends "0.6"
          ? {
                paymasterAndData: Hex
                sponsor?: { name: string; icon?: string }
                isFinal?: boolean
            }
          : never)
    | (entryPointVersion extends "0.7"
          ? {
                paymaster: Hex
                paymasterData: Hex
                paymasterVerificationGasLimit?: Hex | null
                paymasterPostOpGasLimit?: Hex | null
                sponsor?: { name: string; icon?: string }
                isFinal?: boolean
            }
          : never)
>

export type GetRpcPaymasterDataParameters<
    entryPointVersion extends "0.6" | "0.7"
> =
    | [
          userOperation: UserOperation<entryPointVersion, Hex>,
          entryPoint: Address,
          chainId: Hex,
          context?: Record<string, unknown>
      ]
    | [
          userOperation: UserOperation<entryPointVersion, Hex>,
          entryPoint: Address,
          chainId: Hex
      ]

export type GetRpcPaymasterDataReturnType<
    entryPointVersion extends "0.6" | "0.7"
> = OneOf<
    | (entryPointVersion extends "0.6"
          ? {
                paymasterAndData: Hex
            }
          : never)
    | (entryPointVersion extends "0.7"
          ? {
                paymaster: Hex
                paymasterData: Hex
            }
          : never)
>

export type Eip7677RpcSchema<entryPointVersion extends "0.6" | "0.7"> = [
    {
        Method: "pm_getPaymasterStubData"
        Parameters: GetRpcPaymasterStubDataParameters<entryPointVersion>
        ReturnType: GetRpcPaymasterStubDataReturnType<entryPointVersion>
    },
    {
        Method: "pm_getPaymasterData"
        Parameters: GetRpcPaymasterDataParameters<entryPointVersion>
        ReturnType: GetRpcPaymasterDataReturnType<entryPointVersion>
    }
]
