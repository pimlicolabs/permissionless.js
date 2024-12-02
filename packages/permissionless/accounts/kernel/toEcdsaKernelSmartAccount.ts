import type { Address } from "viem"
import {
    type KernelSmartAccountImplementation,
    type KernelVersion,
    type ToKernelSmartAccountParameters,
    type ToKernelSmartAccountReturnType,
    toKernelSmartAccount
} from "./toKernelSmartAccount.js"

export type ToEcdsaKernelSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>
> = ToKernelSmartAccountParameters<entryPointVersion, kernelVersion> & {
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
    kernelVersion extends KernelVersion<entryPointVersion>
>(
    parameters: ToEcdsaKernelSmartAccountParameters<
        entryPointVersion,
        kernelVersion
    >
): Promise<ToEcdsaKernelSmartAccountReturnType<entryPointVersion>> {
    return toKernelSmartAccount({
        ...parameters,
        validatorAddress:
            parameters.validatorAddress ?? parameters.ecdsaValidatorAddress
    })
}
