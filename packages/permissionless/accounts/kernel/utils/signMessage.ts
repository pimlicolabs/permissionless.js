import {
    type LocalAccount,
    type SignMessageReturnType,
    type SignableMessage,
    hashMessage
} from "viem"
import { signMessage as _signMessage } from "viem/actions"
import { isKernelV2 } from "./isKernelV2.js"
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
    if (isKernelV2(accountVersion)) {
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
