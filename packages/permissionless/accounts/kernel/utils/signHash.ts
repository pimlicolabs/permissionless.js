import type { Account } from "viem"
import type { WebAuthnAccount } from "viem/erc4337"
import { AbiParameters, type Address, Hex, Signature } from "viem/utils"
import type { Version } from "../version.js"
import { wrapMessageHash } from "./wrapMessageHash.js"

export type SignHashParameters = {
    hash: Hex.Hex
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

export async function signWebAuthn(
    owner: WebAuthnAccount.Account,
    hash: Hex.Hex
): Promise<Hex.Hex> {
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

export async function signHash({
    hash,
    owner,
    address,
    version,
    chainId,
    eip7702 = false
}: SignHashParameters): Promise<Hex.Hex> {
    if (owner.type === "webAuthn")
        return signWebAuthn(
            owner,
            wrapMessageHash({ hash, address, version, chainId })
        )
    if (eip7702)
        return owner.signTypedData(
            toKernelTypedData({ hash, address, version, chainId })
        )
    if (version === "0.2.1" || version === "0.2.2")
        return owner.signMessage({ message: { raw: hash } })
    return owner.signMessage({
        message: { raw: wrapMessageHash({ hash, address, version, chainId }) }
    })
}
