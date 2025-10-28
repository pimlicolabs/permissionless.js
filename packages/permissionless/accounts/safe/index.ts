import { signUserOperation } from "./signUserOperation.js"
import { toSafeSmartAccount } from "./toSafeSmartAccount.js"

export const SafeSmartAccount = {
    toSafeSmartAccount,
    signUserOperation
}

export type {
    SafeSmartAccountImplementation,
    SafeVersion,
    ToSafeSmartAccountParameters,
    ToSafeSmartAccountReturnType
} from "./toSafeSmartAccount.js"
