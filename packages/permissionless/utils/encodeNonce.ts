export function encodeNonce({
    key,
    sequence
}: { key: bigint; sequence: bigint }): bigint {
    return (key << BigInt(64)) + sequence
}
