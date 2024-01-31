import { createSmartAccountClient } from "permissionless"
import {
    type SignerToEcdsaKernelSmartAccountParameters,
    type SmartAccountSigner,
    signerToEcdsaKernelSmartAccount
} from "permissionless/accounts"
import type { SponsorUserOperationMiddleware } from "permissionless/actions/smartAccount"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, PublicClient, Transport } from "viem"
import { smartAccount } from "./smartAccount"

export type KernelSmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
> = Prettify<
    {
        publicClient: PublicClient<TTransport, TChain>
        signer: SmartAccountSigner<TSource, TAddress>
        transport: TTransport
    } & Omit<
        SignerToEcdsaKernelSmartAccountParameters<TSource, TAddress>,
        "signer"
    > &
        SponsorUserOperationMiddleware
>

export async function kernelSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
>({
    publicClient,
    signer,
    transport,
    sponsorUserOperation,
    ...rest
}: KernelSmartAccountParameters<TTransport, TChain, TSource, TAddress>) {
    const smartAccountClient = createSmartAccountClient({
        account: await signerToEcdsaKernelSmartAccount(publicClient, {
            ...rest,
            signer
        }),
        transport: transport,
        sponsorUserOperation
    })

    return smartAccount({
        smartAccountClient: smartAccountClient
    })
}
