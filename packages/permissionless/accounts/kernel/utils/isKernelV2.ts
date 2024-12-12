import type { KernelVersion } from "../toKernelSmartAccount.js"

export const isKernelV2 = (version: KernelVersion<"0.6" | "0.7">): boolean => {
    const regex = /0\.2\.\d+/
    return regex.test(version)
}
