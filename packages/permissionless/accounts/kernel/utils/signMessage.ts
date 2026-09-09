import type { Account } from "viem"
import type { WebAuthnAccount } from "viem/erc4337"
import {
    AbiParameters,
    type Address,
    Hex,
    PersonalMessage,
    Signature
} from "viem/utils"
import type { Version } from "../version.js"
import { wrapMessageHash } from "./wrapMessageHash.js"

export type SignMessageParameters = {
    message: Account.SignableMessage
    owner: Account.Local | WebAuthnAccount.Account
    address: Address.Address
    version: Version
    chainId: number
    eip7702?: boolean | undefined
}

export const webAuthnSignatureParameters = [
    { name: "authenticatorData", type: "bytes" },
    { name: "clientDataJSON", type: "string" },
    { name: "responseTypeLocation", type: "uint256" },
    { name: "r", type: "uint256" },
    { name: "s", type: "uint256" },
    { name: "usePrecompiled", type: "bool" }
] as const

export const hashMessage = (message: Account.SignableMessage) =>
    PersonalMessage.getSignPayload(
        typeof message === "string" ? Hex.fromString(message) : message.raw
    )

export const toKernelTypedData = ({
    hash,
    address,
    version,
    chainId
}: {
    hash: Hex.Hex
    address: Address.Address
    version: Version
    chainId: number
}) =>
    ({
        domain: {
            name: "Kernel",
            version,
            chainId,
            verifyingContract: address
        },
        types: { Kernel: [{ name: "hash", type: "bytes32" }] },
        primaryType: "Kernel",
        message: { hash }
    }) as const

export async function signMessage({
    message,
    owner,
    address,
    version,
    chainId,
    eip7702 = false
}: SignMessageParameters): Promise<Hex.Hex> {
    if (owner.type === "webAuthn") {
        const hash =
            typeof message === "string"
                ? wrapMessageHash({
                      hash: hashMessage(message),
                      address,
                      version,
                      chainId
                  })
                : message.raw instanceof Uint8Array
                  ? Hex.fromBytes(message.raw)
                  : message.raw
        const { signature, webauthn } = await owner.sign({ hash })
        const { r, s } = Signature.fromHex(signature)
        return AbiParameters.encode(webAuthnSignatureParameters, [
            webauthn.authenticatorData,
            webauthn.clientDataJSON,
            BigInt(webauthn.typeIndex ?? 0),
            Hex.toBigInt(r),
            Hex.toBigInt(s),
            false
        ])
    }
    if (eip7702)
        return owner.signTypedData(
            toKernelTypedData({
                hash: hashMessage(message),
                address,
                version,
                chainId
            })
        )
    if (version === "0.2.1" || version === "0.2.2")
        return owner.signMessage({ message })
    return owner.signMessage({
        message: {
            raw: wrapMessageHash({
                hash: hashMessage(message),
                address,
                version,
                chainId
            })
        }
    })
}
