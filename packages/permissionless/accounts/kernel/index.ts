import { to7702KernelSmartAccount } from "./to7702KernelSmartAccount.js"
import { toKernelSmartAccount } from "./toKernelSmartAccount.js"
import { isKernelV2 } from "./utils/isKernelV2.js"
import { signMessage } from "./utils/signMessage.js"
import { signTypedData } from "./utils/signTypedData.js"
import { wrapMessageHash } from "./utils/wrapMessageHash.js"

export const KernelSmartAccount = {
    toKernelSmartAccount,
    to7702KernelSmartAccount,
    wrapMessageHash,
    signMessage,
    signTypedData,
    isKernelV2
}

export type {
    KernelSmartAccountImplementation,
    KernelVersion,
    ToKernelSmartAccountParameters,
    ToKernelSmartAccountReturnType
} from "./toKernelSmartAccount.js"
export type {
    EcdsaKernelSmartAccountImplementation,
    ToEcdsaKernelSmartAccountParameters,
    ToEcdsaKernelSmartAccountReturnType
} from "./toEcdsaKernelSmartAccount.js"
export type {
    To7702KernelSmartAccountImplementation,
    To7702KernelSmartAccountParameters,
    To7702KernelSmartAccountReturnType
} from "./to7702KernelSmartAccount.js"
export type { WrapMessageHashParams } from "./utils/wrapMessageHash.js"
