import { Hex } from "viem/utils"

export function decodeNonce(nonce: bigint): { key: bigint; sequence: bigint } {
    const parsedNonce = BigInt(Hex.fromNumber(nonce, { size: 32 }))

    const key = parsedNonce >> BigInt(64)
    const sequence = parsedNonce & BigInt("0xFFFFFFFFFFFFFFFF")

    return { key, sequence }
}
