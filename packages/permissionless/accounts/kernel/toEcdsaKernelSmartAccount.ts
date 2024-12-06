import type {
    Account,
    Address,
    Chain,
    LocalAccount,
    OneOf,
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

export type ToEcdsaKernelSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
> = ToKernelSmartAccountParameters<entryPointVersion, kernelVersion, owner> & {
    ecdsaValidatorAddress?: Address
}

export type EcdsaKernelSmartAccountImplementation<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = KernelSmartAccountImplementation<entryPointVersion>

export type ToEcdsaKernelSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = ToKernelSmartAccountReturnType<entryPointVersion>
/**
 * Build a kernel smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
export async function toEcdsaKernelSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
>(
    parameters: ToEcdsaKernelSmartAccountParameters<
        entryPointVersion,
        kernelVersion,
        owner
    >
): Promise<ToEcdsaKernelSmartAccountReturnType<entryPointVersion>> {
    return toKernelSmartAccount({
        ...parameters,
        validatorAddress:
            parameters.validatorAddress ?? parameters.ecdsaValidatorAddress
    })
}
