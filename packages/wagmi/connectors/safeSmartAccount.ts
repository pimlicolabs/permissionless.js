import { createSmartAccountClient } from "permissionless"
import {
    type SignerToSafeSmartAccountParameters,
    type SmartAccountSigner,
    signerToSafeSmartAccount
} from "permissionless/accounts"
import type { SponsorUserOperationMiddleware } from "permissionless/actions/smartAccount"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, PublicClient, Transport } from "viem"
import { smartAccount } from "./smartAccount"

export type SafeSmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
> = Prettify<
    {
        publicClient: PublicClient<TTransport, TChain>
        signer: SmartAccountSigner<TSource, TAddress>
        transport: TTransport
    } & Omit<SignerToSafeSmartAccountParameters<TSource, TAddress>, "signer"> &
        SponsorUserOperationMiddleware
>

export async function safeSmartAccount<
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
}: SafeSmartAccountParameters<TTransport, TChain, TSource, TAddress>) {
    const smartAccountClient = createSmartAccountClient({
        account: await signerToSafeSmartAccount(publicClient, {
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
