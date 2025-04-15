import { Base64, type WebAuthnP256 } from "ox"
// import { Base64 } from "ox"
import type { Account, Chain, Client, Hex, Transport } from "viem"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

export type VerifyAuthenticationParameters = WebAuthnP256.sign.ReturnType & {
    uuid: string
}

export type VerifyAuthenticationReturnType = {
    success: boolean
    id: string
    publicKey: Hex
    userName: string
}

export const verifyAuthentication = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PasskeyServerRpcSchema
    >,
    args: VerifyAuthenticationParameters
): Promise<VerifyAuthenticationReturnType> => {
    const { raw, uuid } = args

    let responseAuthenticatorData: string

    if ("authenticatorData" in raw.response) {
        responseAuthenticatorData = Base64.fromBytes(
            new Uint8Array(raw.response.authenticatorData as ArrayBuffer),
            {
                url: true
            }
        )
    } else {
        throw new Error("authenticatorData not found in the signature")
    }

    let signature: string
    if ("signature" in raw.response) {
        signature = Base64.fromBytes(
            new Uint8Array(raw.response.signature as ArrayBuffer),
            {
                pad: false,
                url: true
            }
        )
    } else {
        throw new Error("signature not found in the signature")
    }

    let userHandle: string | undefined
    if ("userHandle" in raw.response) {
        userHandle = Base64.fromBytes(
            new Uint8Array(raw.response.userHandle as ArrayBuffer),
            {
                pad: false,
                url: true
            }
        )
    }

    const serverResponse = await client.request(
        {
            method: "pks_verifyAuthentication",
            params: [
                {
                    id: raw.id,
                    rawId: Base64.fromBytes(new Uint8Array(raw.rawId), {
                        pad: false,
                        url: true
                    }),
                    authenticatorAttachment: raw.authenticatorAttachment as
                        | "cross-platform"
                        | "platform",
                    response: {
                        clientDataJSON: Base64.fromBytes(
                            new Uint8Array(raw.response.clientDataJSON),
                            {
                                pad: false,
                                url: true
                            }
                        ),
                        authenticatorData: responseAuthenticatorData,
                        signature,
                        userHandle
                    },
                    clientExtensionResults: raw.getClientExtensionResults(),
                    type: raw.type as "public-key"
                },
                {
                    uuid
                }
            ]
        },
        {
            retryCount: 0
        }
    )

    const success = Boolean(serverResponse?.success)
    const id = serverResponse?.id
    const publicKey = serverResponse?.publicKey
    const userName = serverResponse?.userName

    if (typeof id !== "string") {
        throw new Error("Invalid passkey id returned from server")
    }

    if (typeof publicKey !== "string" || !publicKey.startsWith("0x")) {
        throw new Error(
            "Invalid public key returned from server - must be hex string starting with 0x"
        )
    }

    if (typeof userName !== "string") {
        throw new Error("Invalid user name returned from server")
    }

    return {
        success,
        id,
        publicKey: publicKey as Hex,
        userName
    }
}
