import type {
    SmartAccount,
    SmartAccountImplementation
} from "viem/account-abstraction"

export type IsUndefined<T> = [undefined] extends [T] ? true : false

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>

export type GetAccountParameter<
    implementation extends
        | SmartAccountImplementation
        | undefined = SmartAccountImplementation
> = IsUndefined<implementation> extends true
    ? { account: SmartAccount<SmartAccountImplementation> }
    : { account?: SmartAccount<SmartAccountImplementation> }

// biome-ignore lint/suspicious/noExplicitAny: generic type
export type UnionOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never
