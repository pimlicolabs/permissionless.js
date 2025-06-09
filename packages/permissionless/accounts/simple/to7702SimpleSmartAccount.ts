import type {
    Account,
    Chain,
    LocalAccount,
    OneOf,
    Prettify,
    Transport,
    WalletClient
} from "viem"
import type { EthereumProvider } from "../../utils/toOwner.js"
import {
    type SimpleSmartAccountImplementation,
    type ToSimpleSmartAccountParameters,
    type ToSimpleSmartAccountReturnType,
    toSimpleSmartAccount
} from "./toSimpleSmartAccount.js"

export type To7702SimpleSmartAccountParameters<
    entryPointVersion extends "0.8",
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
> = ToSimpleSmartAccountParameters<entryPointVersion, owner, true>

export type To7702SimpleSmartAccountImplementation<
    entryPointVersion extends "0.8" = "0.8"
> = SimpleSmartAccountImplementation<entryPointVersion, true>

export type To7702SimpleSmartAccountReturnType<
    entryPointVersion extends "0.8" = "0.8"
> = ToSimpleSmartAccountReturnType<entryPointVersion, true>

export async function to7702SimpleSmartAccount<
    entryPointVersion extends "0.8",
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
>(
    parameters: Prettify<
        To7702SimpleSmartAccountParameters<entryPointVersion, owner>
    >
): Promise<To7702SimpleSmartAccountReturnType<entryPointVersion>> {
    return toSimpleSmartAccount<entryPointVersion, owner, true>({
        ...parameters,
        eip7702: true
    })
}
