import type { Account, Chain, Client, Transport } from "viem"
import type { IsUndefined } from "viem/types/utils"
import type { SmartAccount } from "../accounts/types"
import type { EntryPoint } from "./entrypoint"
import type { UserOperation } from "./userOperation"
export type { UserOperation }
export type {
    EntryPointVersion,
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    GetEntryPointVersion,
    EntryPoint
} from "./entrypoint"

export type { PackedUserOperation } from "./userOperation"

export type GetAccountParameterWithClient<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
> = IsUndefined<TAccount> extends true
    ? { account: Account; client?: Client<TTransport, TChain, TAccount> }
    : { client: Client<TTransport, TChain, TAccount>; account?: Account }

export type GetAccountParameter<
    entryPoint extends EntryPoint,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = IsUndefined<TAccount> extends true
    ? { account: SmartAccount<entryPoint> }
    : { account?: SmartAccount<entryPoint> }

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>

// biome-ignore lint/suspicious/noExplicitAny: generic type
export type UnionOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never
