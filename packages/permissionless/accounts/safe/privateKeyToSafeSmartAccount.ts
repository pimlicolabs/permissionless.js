import type { Chain, Client, Hex, Transport } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { ENTRYPOINT_ADDRESS_V06_TYPE, Prettify } from "../../types"
import {
    type SafeSmartAccount,
    type SignerToSafeSmartAccountParameters,
    signerToSafeSmartAccount
} from "./signerToSafeSmartAccount"

export type PrivateKeyToSafeSmartAccountParameters<
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
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
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    { privateKey, ...rest }: PrivateKeyToSafeSmartAccountParameters<entryPoint>
): Promise<SafeSmartAccount<entryPoint, TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToSafeSmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
