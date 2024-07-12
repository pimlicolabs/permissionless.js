import type { EntryPoint } from "../../../types"
import type { KernelVersion } from "../signerToEcdsaKernelSmartAccount"

export const isKernelV2 = (version: KernelVersion<EntryPoint>): boolean => {
    const regex = /0\.2\.\d+/
    return regex.test(version)
}
