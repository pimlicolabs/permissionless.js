import { createSmartAccountClient } from "permissionless"
import {
    SignerToSimpleSmartAccount,
    SmartAccountSigner,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import { SponsorUserOperationMiddleware } from "permissionless/actions/smartAccount"
import type {
    Address,
    Chain,
    PublicClient,
    Transport,
    WalletClient
} from "viem"
import { smartAccount } from "./smartAccount"

// const connectSmartAccount = async () => {
//     const client = getPublicClient(config)
//     const walletClient = await getWalletClient(config)

//     const pimlicoClient = createPimlicoPaymasterClient({
//         transport: http(import.meta.env.PAYMASTER_URL)
//     })

//     if (!walletClient) return

//     const smartAccountClient = createSmartAccountClient({
//         account: await signerToSafeSmartAccount(client, {
//             safeVersion: "1.4.1",
//             entryPoint: import.meta.env.ENTRY_POINT,
//             signer: walletClientToCustomSigner(walletClient)
//         }),
//         transport: http(import.meta.env.BUNDLER_URL),
//         sponsorUserOperation: pimlicoClient.sponsorUserOperation
//     })

//     const connector = smartAccount({
//         smartAccountClient: smartAccountClient
//     })

//     connect({ connector })
// }

export async function simpleSmartAccount<
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
}: {
    publicCLient: PublicClient<TTransport, TChain>
    signer: SmartAccountSigner<TSource, TAddress>
    transport: TTransport
} & Omit<SignerToSimpleSmartAccount<TSource, TAddress>, "signer"> &
    SponsorUserOperationMiddleware) {
    const smartAccountClient = createSmartAccountClient({
        account: await signerToSimpleSmartAccount(publicCLient, {
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
