import { toHex } from "viem"

export function deepHexlify(obj: unknown) {
    if (typeof obj === "function") {
        return undefined
    }
    if (obj == null || typeof obj === "string" || typeof obj === "boolean") {
        return obj
    } else if (typeof obj === "bigint") {
        return toHex(obj)
    }
    if (Array.isArray(obj)) {
        return obj.map((member) => deepHexlify(member))
    }
    return Object.keys(obj).reduce(
        (set, key) => ({
            ...set,
            [key]: deepHexlify(obj[key])
        }),
        {}
    )
}
