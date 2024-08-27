import type {
    Chain,
    Client,
    Hex,
    PublicActions,
    PublicRpcSchema,
    Transport
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { ENTRYPOINT_ADDRESS_V07_TYPE, Prettify } from "../../types"

import {
    type EtherspotSmartAccount,
    type SignerToEtherspotSmartAccountParameters,
    signerToEtherspotSmartAccount
} from "./signerToEtherspotSmartAccount"

export type PrivateKeyToEtherspotSmartAccountParameters = Prettify<
    {
        privateKey: Hex
    } & Omit<
        SignerToEtherspotSmartAccountParameters<ENTRYPOINT_ADDRESS_V07_TYPE>,
        "signer"
    >
>

/**
 * @description Creates an Etherspot Account from a private key.
 *
 * @returns A Private Key Etherspot Account.
 */
export async function privateKeyToEtherspotSmartAccount<
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
    { privateKey, ...rest }: PrivateKeyToEtherspotSmartAccountParameters
): Promise<
    EtherspotSmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE, TTransport, TChain>
> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToEtherspotSmartAccount(client, {
        signer: privateKeyAccount,
        ...rest
    })
}
