import type {
    Chain,
    Client,
    Hex,
    PublicActions,
    PublicRpcSchema,
    Transport
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { EntryPoint, Prettify } from "../../types"
import {
    type SafeSmartAccount,
    type SignerToSafeSmartAccountParameters,
    signerToSafeSmartAccount
} from "./signerToSafeSmartAccount"

export type PrivateKeyToSafeSmartAccountParameters<
    entryPoint extends EntryPoint
> = Prettify<
    {
        privateKey: Hex
    } & Omit<SignerToSafeSmartAccountParameters<entryPoint>, "signer">
>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function privateKeyToSafeSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<
        TTransport,
        TChain,
        undefined,
        PublicRpcSchema,
        PublicActions<TTransport, TChain>
    >,
    { privateKey, ...rest }: PrivateKeyToSafeSmartAccountParameters<entryPoint>
): Promise<SafeSmartAccount<entryPoint, TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToSafeSmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
