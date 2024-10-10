import {
    type Address,
    type LocalAccount,
    type SignTypedDataReturnType,
    type TypedDataDefinition,
    type TypedDataDomain,
    encodeAbiParameters,
    getTypesForEIP712Domain,
    hashTypedData,
    validateTypedData
} from "viem"

export async function signTypedData(
    parameters: TypedDataDefinition & {
        accountAddress: Address
        chainId: number
        admin: LocalAccount
    }
): Promise<SignTypedDataReturnType> {
    const { admin, accountAddress, chainId, ...typedData } = parameters
    const isSelfVerifyingContract =
        (
            typedData.domain as TypedDataDomain
        )?.verifyingContract?.toLowerCase() === accountAddress

    // If this is a self-verifying contract, we can use the admin's signature
    if (isSelfVerifyingContract) {
        return admin.signTypedData({
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
    const wrappedMessageHash = encodeAbiParameters(
        [{ type: "bytes32" }],
        [typedHash]
    )

    return admin.signTypedData({
        domain: {
            name: "Account",
            version: "1",
            chainId,
            verifyingContract: accountAddress
        },
        primaryType: "AccountMessage",
        types: { AccountMessage: [{ name: "message", type: "bytes" }] },
        message: { message: wrappedMessageHash }
    })
}
