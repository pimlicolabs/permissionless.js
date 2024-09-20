import {
    type LocalAccount,
    type SignMessageReturnType,
    type SignableMessage,
    hashMessage
} from "viem"
import { type WrapMessageHashParams, wrapMessageHash } from "./wrapMessageHash"

export async function signMessage({
    message,
    owner,
    accountAddress,
    chainId
}: {
    owner: LocalAccount
    message: SignableMessage
} & WrapMessageHashParams): Promise<SignMessageReturnType> {
    const wrappedMessageHash = wrapMessageHash(hashMessage(message), {
        accountAddress,
        chainId
    })

    return owner.signMessage({
        message: { raw: wrappedMessageHash }
    })
}
