import { to7702SimpleSmartAccount } from "./to7702SimpleSmartAccount.js"
import { toSimpleSmartAccount } from "./toSimpleSmartAccount.js"

export const SimpleSmartAccount = {
    toSimpleSmartAccount,
    to7702SimpleSmartAccount
}

export type {
    SimpleSmartAccountImplementation,
    ToSimpleSmartAccountParameters,
    ToSimpleSmartAccountReturnType
} from "./toSimpleSmartAccount.js"
export type {
    To7702SimpleSmartAccountImplementation,
    To7702SimpleSmartAccountParameters,
    To7702SimpleSmartAccountReturnType
} from "./to7702SimpleSmartAccount.js"
