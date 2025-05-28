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
    type KernelSmartAccountImplementation,
    type KernelVersion,
    type ToKernelSmartAccountParameters,
    type ToKernelSmartAccountReturnType,
    toKernelSmartAccount
} from "./toKernelSmartAccount.js"

export type To7702KernelSmartAccountParameters<
    entryPointVersion extends "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
> = ToKernelSmartAccountParameters<
    entryPointVersion,
    kernelVersion,
    owner,
    true
>

export type To7702KernelSmartAccountImplementation<
    entryPointVersion extends "0.7" = "0.7"
> = KernelSmartAccountImplementation<entryPointVersion, true>

export type To7702KernelSmartAccountReturnType<
    entryPointVersion extends "0.7" = "0.7"
> = ToKernelSmartAccountReturnType<entryPointVersion, true>

export async function to7702KernelSmartAccount<
    entryPointVersion extends "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
>(
    parameters: Prettify<
        To7702KernelSmartAccountParameters<
            entryPointVersion,
            kernelVersion,
            owner
        >
    >
): Promise<To7702KernelSmartAccountReturnType<entryPointVersion>> {
    return toKernelSmartAccount({
        ...parameters,
        eip7702: true
    })
}
