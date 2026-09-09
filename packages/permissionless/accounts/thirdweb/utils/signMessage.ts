import {
    type Address,
    hashMessage,
    type LocalAccount,
    type SignableMessage,
    type SignMessageReturnType
} from "viem"

export async function signMessage({
    message,
    admin,
    accountAddress,
    chainId
}: {
    chainId: number
    message: SignableMessage
    admin: LocalAccount
    accountAddress: Address
}): Promise<SignMessageReturnType> {
    const hashedMessage = hashMessage(message)

    return admin.signTypedData({
        domain: {
            name: "Account",
            version: "1",
            chainId,
            verifyingContract: accountAddress
        },
        primaryType: "AccountMessage",
        types: { AccountMessage: [{ name: "message", type: "bytes" }] },
        message: { message: hashedMessage }
    })
}
