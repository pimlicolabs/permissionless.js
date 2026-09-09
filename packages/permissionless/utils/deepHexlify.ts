import { Hex } from "viem/utils"

// biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
export function deepHexlify(obj: any): any {
    if (typeof obj === "function") {
        return undefined
    }
    if (obj == null || typeof obj === "string" || typeof obj === "boolean") {
        return obj
    }

    if (typeof obj === "bigint") {
        return Hex.fromNumber(obj)
    }

    if (obj._isBigNumber != null || typeof obj !== "object") {
        return Hex.fromNumber(
            typeof obj === "number" ? obj : BigInt(obj.toString())
        ).replace(/^0x0/, "0x")
    }
    if (Array.isArray(obj)) {
        return obj.map((member) => deepHexlify(member))
    }
    return Object.keys(obj).reduce(
        // biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
        (set: any, key: string) => {
            set[key] = deepHexlify(obj[key])
            return set
        },
        {}
    )
}
