import {
    type SafeSmartAccountImplementation,
    type SafeVersion,
    type ToSafeSmartAccountParameters,
    type ToSafeSmartAccountReturnType,
    toSafeSmartAccount
} from "./toSafeSmartAccount.js"

import { signUserOperation } from "./signUserOperation.js"

const SafeSmartAccount = {
    toSafeSmartAccount,
    signUserOperation
}

export {
    type SafeSmartAccountImplementation,
    type SafeVersion,
    type ToSafeSmartAccountParameters,
    type ToSafeSmartAccountReturnType,
    SafeSmartAccount
}
