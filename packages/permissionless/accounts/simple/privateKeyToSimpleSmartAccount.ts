import type { Account, Address, Chain, Client, Hex, Transport } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { EntryPoint, Prettify } from "../../types"
import {
    type SignerToSimpleSmartAccountParameters,
    type SimpleSmartAccount,
    signerToSimpleSmartAccount
} from "./signerToSimpleSmartAccount"

export type PrivateKeyToSimpleSmartAccountParameters<
    entryPoint extends EntryPoint
> = Prettify<
    {
        privateKey: Hex
    } & Omit<SignerToSimpleSmartAccountParameters<entryPoint>, "signer">
>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function privateKeyToSimpleSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TClientAccount extends Account | undefined = undefined
>(
    client: Client<TTransport, TChain, TClientAccount>,
    {
        privateKey,
        ...rest
    }: PrivateKeyToSimpleSmartAccountParameters<entryPoint>
): Promise<SimpleSmartAccount<entryPoint, TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToSimpleSmartAccount<
        entryPoint,
        TTransport,
        TChain,
        TClientAccount,
        "privateKey",
        Address
    >(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
