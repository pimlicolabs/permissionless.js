import {
    type SignerToSafeSmartAccountParameters,
    signerToSafeSmartAccount
} from "permissionless/accounts"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, Transport } from "viem"
import {
    type SmartAccountParameters,
    smartAccountConnectorHelper
} from "./simpleSmartAccount"

export type SafeSmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
> = Prettify<
    SmartAccountParameters<
        Omit<SignerToSafeSmartAccountParameters<TSource, TAddress>, "signer">,
        TTransport,
        TChain,
        TSource,
        TAddress
    >
>

export async function safeSmartAccount<
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
    SafeSmartAccountParameters<TTransport, TChain, TSource, TAddress>
>) {
    return smartAccountConnectorHelper({
        account: await signerToSafeSmartAccount(publicClient, {
            ...rest,
            signer
        }),
        publicClient,
        bundlerTransport,
        sponsorUserOperation
    })
}
