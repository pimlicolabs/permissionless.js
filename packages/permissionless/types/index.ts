import type { Account, Chain, Client, Transport } from "viem"
import type { SmartAccount } from "../accounts/types"
import type { UserOperation } from "./userOperation"
export type { UserOperation }

type IsUndefined<T> = [undefined] extends [T] ? true : false

export type GetAccountParameterWithClient<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
> = IsUndefined<TAccount> extends true
    ? { account: Account; client?: Client<TTransport, TChain, TAccount> }
    : { client: Client<TTransport, TChain, TAccount>; account?: Account }

export type GetAccountParameter<
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
> = IsUndefined<TAccount> extends true
    ? { account: SmartAccount }
    : { account?: SmartAccount }

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// biome-ignore lint/suspicious/noExplicitAny: generic type
export type UnionOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never
