import { createSmartAccountClient } from "permissionless"
import {
    type SignerToSimpleSmartAccountParameters,
    type SmartAccount,
    type SmartAccountSigner,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import { type SponsorUserOperationMiddleware } from "permissionless/actions/smartAccount"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, PublicClient, Transport } from "viem"
import { smartAccount } from "./smartAccount"

export type SmartAccountParameters<
    T,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
> = {
    publicClient: PublicClient<TTransport, TChain>
    signer: SmartAccountSigner<TSource, TAddress>
    bundlerTransport: TTransport
} & SponsorUserOperationMiddleware &
    T

export type SimpleSmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<
    SmartAccountParameters<
        Omit<SignerToSimpleSmartAccountParameters<TSource, TAddress>, "signer">,
        TTransport,
        TChain,
        TSource,
        TAddress
    >
>

export async function smartAccountConnectorHelper<
    X,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address,
    Name extends string = string
>({
    bundlerTransport,
    sponsorUserOperation,
    account
}: Omit<
    SmartAccountParameters<X, TTransport, TChain, TSource, TAddress>,
    "signer"
> & {
    account: SmartAccount<Name, TTransport, TChain>
}) {
    const smartAccountClient = createSmartAccountClient({
        account,
        transport: bundlerTransport,
        sponsorUserOperation: sponsorUserOperation
    })

    return smartAccount({
        smartAccountClient: smartAccountClient
    })
}

export async function simpleSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>({
    publicClient,
    signer,
    bundlerTransport,
    sponsorUserOperation,
    ...rest
}: SimpleSmartAccountParameters<TTransport, TChain, TSource, TAddress>) {
    return smartAccountConnectorHelper({
        account: await signerToSimpleSmartAccount(publicClient, {
            ...rest,
            signer
        }),
        publicClient,
        bundlerTransport,
        sponsorUserOperation
    })
}
