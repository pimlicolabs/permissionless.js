import { Hex } from "viem/utils"

export function encodeNonce(args: { key: bigint; sequence: bigint }): bigint {
    const key = BigInt(Hex.fromNumber(args.key, { size: 24 }))
    const sequence = BigInt(Hex.fromNumber(args.sequence, { size: 8 }))

    return (key << BigInt(64)) + sequence
}
