import {
    type LocalAccount,
    type SignMessageReturnType,
    type SignableMessage,
    hashMessage
} from "viem"
import { signMessage as _signMessage } from "viem/actions"
import {
    type WrapMessageHashParams,
    wrapMessageHash
} from "./wrapMessageHash.js"

export async function signMessage({
    message,
    owner,
    accountAddress,
    kernelVersion: accountVersion,
    chainId
}: {
    chainId: number
    message: SignableMessage
    owner: LocalAccount
} & WrapMessageHashParams): Promise<SignMessageReturnType> {
    if (accountVersion === "0.2.1" || accountVersion === "0.2.2") {
        return owner.signMessage({
            message
        })
    }

    const wrappedMessageHash = wrapMessageHash(hashMessage(message), {
        kernelVersion: accountVersion,
        accountAddress,
        chainId
        // chainId: client.chain
        //     ? client.chain.id
        //     : await client.extend(publicActions).getChainId()
    })

    return owner.signMessage({
        message: { raw: wrappedMessageHash }
    })
}
