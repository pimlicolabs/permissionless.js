import { type Hex, encodeAbiParameters, encodePacked } from "viem"
import type { SignReturnType } from "viem/accounts"

export function buildSignatureWrapperForEOA({
    signature,
    ownerIndex
}: {
    signature: SignReturnType
    ownerIndex: bigint
}): Hex {
    if (signature.v === undefined) {
        throw new Error("[buildSignatureWrapperForEOA] Invalid signature")
    }

    const signatureData = encodePacked(
        ["bytes32", "bytes32", "uint8"],
        [signature.r, signature.s, Number.parseInt(signature.v.toString())]
    )
    return encodeAbiParameters(
        [SignatureWrapperStruct],
        [
            {
                ownerIndex,
                signatureData
            }
        ]
    )
}

const SignatureWrapperStruct = {
    components: [
        {
            name: "ownerIndex",
            type: "uint8"
        },
        {
            name: "signatureData",
            type: "bytes"
        }
    ],
    name: "SignatureWrapper",
    type: "tuple"
}
