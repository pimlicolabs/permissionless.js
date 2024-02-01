import {
    type SignerToBiconomySmartAccountParameters,
    signerToBiconomySmartAccount
} from "permissionless/accounts"
import type { Prettify } from "permissionless/types"
import type { Address, Chain, Transport } from "viem"
import {
    type SmartAccountParameters,
    smartAccountConnectorHelper
} from "./simpleSmartAccount"

export type BiconomySmartAccountParameters<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
> = Prettify<
    SmartAccountParameters<
        Omit<
            SignerToBiconomySmartAccountParameters<TSource, TAddress>,
            "signer"
        >,
        TTransport,
        TChain,
        TSource,
        TAddress
    >
>

export async function biconomySmartAccount<
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
    BiconomySmartAccountParameters<TTransport, TChain, TSource, TAddress>
>) {
    return smartAccountConnectorHelper({
        account: await signerToBiconomySmartAccount(publicClient, {
            ...rest,
            signer
        }),
        publicClient,
        bundlerTransport,
        sponsorUserOperation
    })
}
