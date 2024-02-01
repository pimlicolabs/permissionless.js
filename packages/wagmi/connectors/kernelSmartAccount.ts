import {
    type SignerToEcdsaKernelSmartAccountParameters,
    signerToEcdsaKernelSmartAccount
} from "permissionless/accounts"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, Transport } from "viem"
import {
    type SmartAccountParameters,
    smartAccountConnectorHelper
} from "./simpleSmartAccount"

export type KernelSmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
> = Prettify<
    SmartAccountParameters<
        Omit<
            SignerToEcdsaKernelSmartAccountParameters<TSource, TAddress>,
            "signer"
        >,
        TTransport,
        TChain,
        TSource,
        TAddress
    >
>

export async function kernelSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
>({
    publicClient,
    signer,
    bundlerTransport,
    sponsorUserOperation,
    ...rest
}: Prettify<
    KernelSmartAccountParameters<TTransport, TChain, TSource, TAddress>
>) {
    return smartAccountConnectorHelper({
        account: await signerToEcdsaKernelSmartAccount(publicClient, {
            ...rest,
            signer
        }),
        publicClient,
        bundlerTransport,
        sponsorUserOperation
    })
}
