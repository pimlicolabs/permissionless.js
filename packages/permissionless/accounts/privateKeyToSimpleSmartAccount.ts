import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    type SimpleSmartAccount,
    signerToSimpleSmartAccount
} from "./signerToSimpleSmartAccount"

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function privateKeyToSimpleSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    {
        privateKey,
        factoryAddress,
        entryPoint,
        index = 0n
    }: {
        privateKey: Hex
        factoryAddress: Address
        entryPoint: Address
        index?: bigint
    }
): Promise<SimpleSmartAccount<TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToSimpleSmartAccount(client, {
        signer: privateKeyAccount,
        factoryAddress,
        entryPoint,
        index
    })
}
