import {
    type Hex,
    concatHex,
    encodeAbiParameters,
    keccak256,
    stringToHex
} from "viem"
import { type Address, domainSeparator } from "viem"

export type WrapMessageHashParams = {
    accountAddress: Address
    chainId: number
}

export const wrapMessageHash = (
    messageHash: Hex,
    { accountAddress, chainId }: WrapMessageHashParams
) => {
    const _domainSeparator = domainSeparator({
        domain: {
            name: "ModularEtherspotWallet",
            chainId,
            verifyingContract: accountAddress
        }
    })

    const wrappedMessageHash = keccak256(
        encodeAbiParameters(
            [{ type: "bytes32" }, { type: "bytes32" }],
            [
                keccak256(stringToHex("ModularEtherspotWallet(bytes32 hash)")),
                messageHash
            ]
        )
    )

    const digest = keccak256(
        concatHex(["0x1901", _domainSeparator, wrappedMessageHash])
    )

    return digest
}
