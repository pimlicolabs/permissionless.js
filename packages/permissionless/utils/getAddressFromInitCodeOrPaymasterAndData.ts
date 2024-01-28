import { type Address, type Hex, getAddress } from "viem"

export function getAddressFromInitCodeOrPaymasterAndData(
    data: Hex
): Address | undefined {
    if (!data) {
        return undefined
    }
    if (data.length >= 42) {
        return getAddress(data.slice(0, 42))
    }
    return undefined
}
