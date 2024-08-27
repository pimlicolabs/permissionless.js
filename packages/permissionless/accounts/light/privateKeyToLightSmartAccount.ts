import type {
    Chain,
    Client,
    Hex,
    PublicActions,
    PublicRpcSchema,
    Transport
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { Prettify } from "../../types"
import type { EntryPoint } from "../../types"
import {
    type LightSmartAccount,
    type SignerToLightSmartAccountParameters,
    signerToLightSmartAccount
} from "./signerToLightSmartAccount"

export type PrivateKeyToLightSmartAccountParameters<
    entryPoint extends EntryPoint
> = Prettify<
    {
        privateKey: Hex
    } & Omit<SignerToLightSmartAccountParameters<entryPoint>, "signer">
>

/**
 * @description Creates an Light Account from a private key.
 *
 * @returns A Private Key Light Account.
 */
export async function privateKeyToLightSmartAccount<
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
    { privateKey, ...rest }: PrivateKeyToLightSmartAccountParameters<entryPoint>
): Promise<LightSmartAccount<entryPoint, TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToLightSmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
