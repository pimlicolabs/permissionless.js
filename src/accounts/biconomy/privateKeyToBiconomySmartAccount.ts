import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    type BiconomySmartAccount,
    signerToBiconomySmartAccount
} from "./signerToBiconomySmartAccount.js"

/**
 * @description Creates a Biconomy Smart Account from a private key.
 *
 * @returns A Private Key Biconomy Smart Account using ECDSA as default validation module.
 */
export async function privateKeyToBiconomySmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        privateKey,
        entryPoint,
        index = 0n
    }: {
        privateKey: Hex
        entryPoint: Address
        index?: bigint
    }
): Promise<BiconomySmartAccount<TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)
    return signerToBiconomySmartAccount(client, {
        signer: privateKeyAccount,
        entryPoint,
        index
    })
}
