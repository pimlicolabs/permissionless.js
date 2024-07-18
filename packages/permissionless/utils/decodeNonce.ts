import { toHex } from "viem"

export function decodeNonce(nonce: bigint): { key: bigint; sequence: bigint } {
    const parsedNonce = BigInt(toHex(nonce, { size: 32 }))

    const key = parsedNonce >> BigInt(64)
    const sequence = parsedNonce & BigInt("0xFFFFFFFFFFFFFFFF")

    return { key, sequence }
}
