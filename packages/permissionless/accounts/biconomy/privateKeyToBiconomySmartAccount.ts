import { type Chain, type Client, type Hex, type Transport } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { Prettify } from "../../types"
import {
    type BiconomySmartAccount,
    type SignerToBiconomySmartAccountParameters,
    signerToBiconomySmartAccount
} from "./signerToBiconomySmartAccount"

export type PrivateKeyToBiconomySmartAccountParameters = Prettify<
    {
        privateKey: Hex
    } & Omit<SignerToBiconomySmartAccountParameters, "signer">
>

/**
 * @description Creates a Biconomy Smart Account from a private key.
 *
 * @returns A Private Key Biconomy Smart Account using ECDSA as default validation module.
 */
export async function privateKeyToBiconomySmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    { privateKey, ...rest }: PrivateKeyToBiconomySmartAccountParameters
): Promise<BiconomySmartAccount<TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)
    return signerToBiconomySmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
