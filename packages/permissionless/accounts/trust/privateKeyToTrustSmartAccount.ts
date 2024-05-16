import { type Chain, type Client, type Hex, type Transport } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { ENTRYPOINT_ADDRESS_V06_TYPE, Prettify } from "../../types"
import {
    type SignerToTrustSmartAccountParameters,
    type TrustSmartAccount,
    signerToTrustSmartAccount
} from "./signerToTrustSmartAccount"

export type PrivateKeyToTrustSmartAccountParameters<
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
> = Prettify<
    {
        privateKey: Hex
    } & Omit<SignerToTrustSmartAccountParameters<entryPoint>, "signer">
>

/**
 * @description Creates an Trust Account from a private key.
 *
 * @returns A Private Key Trust Account.
 */
export async function privateKeyToTrustSmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    { privateKey, ...rest }: PrivateKeyToTrustSmartAccountParameters<entryPoint>
): Promise<TrustSmartAccount<entryPoint, TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToTrustSmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
