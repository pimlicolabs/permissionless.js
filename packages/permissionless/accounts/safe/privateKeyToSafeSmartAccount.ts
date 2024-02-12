import { type Chain, type Client, type Hex, type Transport } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { DefaultEntryPoint, EntryPoint, Prettify } from "../../types"
import {
    type SafeSmartAccount,
    type SignerToSafeSmartAccountParameters,
    signerToSafeSmartAccount
} from "./signerToSafeSmartAccount"

export type PrivateKeyToSafeSmartAccountParameters = Prettify<
    {
        privateKey: Hex
    } & Omit<SignerToSafeSmartAccountParameters, "signer">
>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function privateKeyToSafeSmartAccount<
    entryPoint extends EntryPoint = DefaultEntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    { privateKey, ...rest }: PrivateKeyToSafeSmartAccountParameters
): Promise<SafeSmartAccount<entryPoint, TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToSafeSmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
