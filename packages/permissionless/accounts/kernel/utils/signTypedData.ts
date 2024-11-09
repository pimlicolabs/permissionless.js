import {
    type LocalAccount,
    type SignTypedDataReturnType,
    type TypedDataDefinition,
    getTypesForEIP712Domain,
    hashTypedData,
    validateTypedData
} from "viem"
import { isKernelV2 } from "./isKernelV2"
import { type WrapMessageHashParams, wrapMessageHash } from "./wrapMessageHash"

export async function signTypedData(
    parameters: TypedDataDefinition &
        WrapMessageHashParams & {
            owner: LocalAccount
        }
): Promise<SignTypedDataReturnType> {
    const {
        owner,
        accountAddress,
        kernelVersion: accountVersion,
        chainId,
        ...typedData
    } = parameters

    if (accountVersion === "0.2.1" || accountVersion === "0.2.2") {
        return owner.signTypedData({
            ...typedData
        })
    }
    const { message, primaryType, types: _types, domain } = typedData
    const types = {
        EIP712Domain: getTypesForEIP712Domain({
            domain: domain
        }),
        ..._types
    }

    // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
    // as we can't statically check this with TypeScript.
    validateTypedData({
        domain,
        message,
        primaryType,
        types
    })

    const typedHash = hashTypedData({ message, primaryType, types, domain })

    const wrappedMessageHash = wrapMessageHash(typedHash, {
        kernelVersion: accountVersion,
        accountAddress,
        chainId: chainId
    })

    return owner.signMessage({
        message: { raw: wrappedMessageHash }
    })
}
