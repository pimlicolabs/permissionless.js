import {
    type Account,
    type Chain,
    type Client,
    type LocalAccount,
    type SignMessageParameters,
    type SignMessageReturnType,
    type Transport,
    hashMessage,
    publicActions
} from "viem"
import { signMessage as _signMessage } from "viem/actions"
import { type WrapMessageHashParams, wrapMessageHash } from "./wrapMessageHash"

export async function signMessage<
    TChain extends Chain | undefined,
    TAccount extends Account | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    {
        account: account_ = client.account,
        message,
        accountAddress,
        accountVersion
    }: SignMessageParameters<TAccount> & WrapMessageHashParams
): Promise<SignMessageReturnType> {
    if (accountVersion === "0.2.2") {
        return _signMessage(client, {
            account: account_ as LocalAccount,
            message
        })
    }

    const wrappedMessageHash = wrapMessageHash(hashMessage(message), {
        accountVersion,
        accountAddress,
        chainId: client.chain
            ? client.chain.id
            : await client.extend(publicActions).getChainId()
    })

    const signature = await _signMessage(client, {
        account: account_ as LocalAccount,
        message: { raw: wrappedMessageHash }
    })

    return signature
}
