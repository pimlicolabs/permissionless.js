import { createSmartAccountClient } from "permissionless"
import {
    type SignerToBiconomySmartAccountParameters,
    type SmartAccountSigner,
    signerToBiconomySmartAccount
} from "permissionless/accounts"
import type { SponsorUserOperationMiddleware } from "permissionless/actions/smartAccount"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, PublicClient, Transport } from "viem"
import { smartAccount } from "./smartAccount"

export type BiconomySmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
> = Prettify<
    {
        publicCLient: PublicClient<TTransport, TChain>
        signer: SmartAccountSigner<TSource, TAddress>
        transport: TTransport
    } & Omit<
        SignerToBiconomySmartAccountParameters<TSource, TAddress>,
        "signer"
    > &
        SponsorUserOperationMiddleware
>

export async function biconomySmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
>({
    publicCLient,
    signer,
    transport,
    sponsorUserOperation,
    ...rest
}: BiconomySmartAccountParameters<TTransport, TChain, TSource, TAddress>) {
    const smartAccountClient = createSmartAccountClient({
        account: await signerToBiconomySmartAccount(publicCLient, {
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
