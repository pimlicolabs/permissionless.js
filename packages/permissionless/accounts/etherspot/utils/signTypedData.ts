import {
    type LocalAccount,
    type SignTypedDataReturnType,
    type TypedDataDefinition,
    getTypesForEIP712Domain,
    hashTypedData,
    validateTypedData
} from "viem"

import { signTypedData as _signTypedData, signMessage } from "viem/actions"
import { type WrapMessageHashParams, wrapMessageHash } from "./wrapMessageHash"

export async function signTypedData(
    parameters: TypedDataDefinition &
        WrapMessageHashParams & {
            owner: LocalAccount
        }
): Promise<SignTypedDataReturnType> {
    const { owner, accountAddress, chainId, ...typedData } = parameters

    const { message, primaryType, types: _types, domain } = typedData
    const types = {
        EIP712Domain: getTypesForEIP712Domain({
            domain: domain
        }),
        ..._types
    }

    validateTypedData({
        domain,
        message,
        primaryType,
        types
    })

    const typedHash = hashTypedData({ message, primaryType, types, domain })

    const wrappedMessageHash = wrapMessageHash(typedHash, {
        accountAddress,
        chainId
    })

    return owner.signMessage({
        message: { raw: wrappedMessageHash }
    })
}
