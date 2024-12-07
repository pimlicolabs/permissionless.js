import {
    type Hash,
    type LocalAccount,
    type SignMessageReturnType,
    type SignableMessage,
    encodeAbiParameters,
    hashMessage
} from "viem"
import type { WebAuthnAccount } from "viem/account-abstraction"
import { signMessage as _signMessage } from "viem/actions"
import { parseSignature } from "webauthn-p256"
import { isWebAuthnAccount } from "./isWebAuthnAccount.js"
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
    owner: LocalAccount | WebAuthnAccount
} & WrapMessageHashParams): Promise<SignMessageReturnType> {
    if (isWebAuthnAccount(owner)) {
        let messageContent: string
        if (typeof message === "string") {
            // message is a string
            messageContent = wrapMessageHash(hashMessage(message), {
                kernelVersion: accountVersion,
                accountAddress,
                chainId
                // chainId: client.chain
                //     ? client.chain.id
                //     : await client.extend(publicActions).getChainId()
            })
        } else if ("raw" in message && typeof message.raw === "string") {
            // message.raw is a Hex string
            messageContent = message.raw
        } else if ("raw" in message && message.raw instanceof Uint8Array) {
            // message.raw is a ByteArray
            messageContent = message.raw.toString()
        } else {
            throw new Error("Unsupported message format")
        }

        const { signature: signatureData, webauthn } = await owner.sign({
            hash: messageContent as Hash
        })
        const signature = parseSignature(signatureData)

        // encode signature
        const encodedSignature = encodeAbiParameters(
            [
                { name: "authenticatorData", type: "bytes" },
                { name: "clientDataJSON", type: "string" },
                { name: "responseTypeLocation", type: "uint256" },
                { name: "r", type: "uint256" },
                { name: "s", type: "uint256" },
                { name: "usePrecompiled", type: "bool" }
            ],
            [
                webauthn.authenticatorData,
                webauthn.clientDataJSON,
                BigInt(webauthn.typeIndex),
                BigInt(signature.r),
                BigInt(signature.s),
                false // TODO: check if it is a RIP 7212 supported network
            ]
        )
        return encodedSignature
    }

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
