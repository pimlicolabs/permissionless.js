import type { Client, Transport } from "viem"
import type { Hex } from "viem/utils"
import {
    InvalidPasskeyCredentialError,
    InvalidPasskeyServerResponseError
} from "../../errors/passkeyServer.js"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"
import * as Base64 from "../../utils/base64.js"

export type VerifyAuthenticationParameters = {
    raw: {
        id: string
        rawId: ArrayBuffer
        authenticatorAttachment: string
        response: {
            authenticatorData?: ArrayBuffer
            signature?: ArrayBuffer
            userHandle?: ArrayBuffer
            clientDataJSON: ArrayBuffer
        }
        getClientExtensionResults: () => Record<string, unknown>
        type: string
    }
    uuid: string
}

export type VerifyAuthenticationReturnType = {
    success: boolean
    id: string
    publicKey: Hex.Hex
    userName: string
}

export const verifyAuthentication = async (
    client: Pick<Client.Client, "request">,
    args: VerifyAuthenticationParameters
): Promise<VerifyAuthenticationReturnType> => {
    const { raw, uuid } = args
    const request =
        client.request as Transport.RequestFn<PasskeyServerRpcSchema>

    let responseAuthenticatorData: string

    if ("authenticatorData" in raw.response) {
        responseAuthenticatorData = Base64.fromBytes(
            new Uint8Array(raw.response.authenticatorData as ArrayBuffer),
            {
                url: true
            }
        )
    } else {
        throw new InvalidPasskeyCredentialError({ field: "authenticatorData" })
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
        throw new InvalidPasskeyCredentialError({ field: "signature" })
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

    const serverResponse = await request(
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

    const invalid = (reason: string) =>
        new InvalidPasskeyServerResponseError({
            method: "pks_verifyAuthentication",
            reason
        })
    if (typeof id !== "string") throw invalid("`id` must be a string.")
    if (typeof publicKey !== "string" || !publicKey.startsWith("0x"))
        throw invalid("`publicKey` must be a 0x-prefixed hex string.")
    if (typeof userName !== "string")
        throw invalid("`userName` must be a string.")

    return {
        success,
        id,
        publicKey: publicKey as Hex.Hex,
        userName
    }
}
