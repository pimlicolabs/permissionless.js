import type { Chain } from "viem"
import type { BundlerClient, PaymasterClient, SmartAccount } from "viem/erc4337"
import type { Abi, AbiFunction, AbiParameters } from "viem/utils"

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export type ExactPartial<type> = {
    [key in keyof type]?: type[key] | undefined
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> &
    ExactPartial<Pick<T, K>>

export type UnionPartialBy<T, K extends keyof T> = T extends unknown
    ? PartialBy<T, K>
    : never

type Assign_<T, U> = {
    [K in keyof T as K extends keyof U
        ? U[K] extends void
            ? never
            : K
        : K]: K extends keyof U ? U[K] : T[K]
}

export type Assign<T, U> = Assign_<T, U> & U

export type KeyofUnion<type> = type extends type ? keyof type : never

export type OneOf<
    union extends object,
    fallback extends object | undefined = undefined,
    keys extends KeyofUnion<union> = KeyofUnion<union>
> = union extends infer item
    ? Prettify<
          item & {
              [key in Exclude<keys, keyof item>]?: fallback extends object
                  ? key extends keyof fallback
                      ? fallback[key]
                      : undefined
                  : undefined
          }
      >
    : never

export type IsUndefined<T> = [undefined] extends [T] ? true : false

/** viem's paymaster config plus any client carrying a `paymaster` decorator (e.g. a PimlicoClient). */
export type Paymaster = BundlerClient.Paymaster | PaymasterClient.Decorator

export type GetSmartAccountParameter<
    account extends SmartAccount.SmartAccount | undefined,
    accountOverride extends SmartAccount.SmartAccount | undefined = undefined
> = {
    account?:
        | Exclude<account, undefined>
        | accountOverride
        | SmartAccount.SmartAccount
        | undefined
}

export type GetChainParameter<
    chain extends Chain.Chain | undefined,
    chainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
> =
    IsUndefined<chain> extends true
        ? { chain: chainOverride | null }
        : { chain?: chainOverride | null | undefined }

export type AbiStateMutability = "pure" | "view" | "nonpayable" | "payable"

export type ContractFunctionName<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    mutability extends AbiStateMutability = AbiStateMutability
> =
    AbiFunction.ExtractNames<
        abi extends Abi.Abi ? abi : Abi.Abi,
        mutability
    > extends infer functionName extends string
        ? [functionName] extends [never]
            ? string
            : functionName
        : string

export type ContractFunctionArgs<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    mutability extends AbiStateMutability = AbiStateMutability,
    functionName extends ContractFunctionName<
        abi,
        mutability
    > = ContractFunctionName<abi, mutability>
> = Extract<
    (abi extends Abi.Abi ? abi : Abi.Abi)[number],
    { type: "function"; stateMutability: mutability; name: functionName }
>["inputs"] extends infer inputs extends AbiParameters.AbiParameters
    ? AbiParameters.decode.ReturnType<inputs, "Array"> extends infer args
        ? [args] extends [never]
            ? readonly unknown[]
            : args
        : readonly unknown[]
    : readonly unknown[]
