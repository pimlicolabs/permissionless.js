import type { Client, Transport } from "viem"
import type { Hex, WebAuthn } from "viem/utils"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"
import * as Base64 from "../../utils/base64.js"

export type VerifyRegistrationParameters = {
    credential: WebAuthn.P256Credential
    context: unknown
}

export type VerifyRegistrationReturnType = {
    success: boolean
    id: string
    publicKey: Hex.Hex
    userName: string
}

export const verifyRegistration = async (
    client: Pick<Client.Client, "request">,
    args: VerifyRegistrationParameters
): Promise<VerifyRegistrationReturnType> => {
    const { credential, context } = args
    const request =
        client.request as Transport.RequestFn<PasskeyServerRpcSchema>

    const response = credential.raw
        .response as unknown as AuthenticatorAttestationResponse

    let responsePublicKeyAlgorithm: number | undefined
    if (typeof response.getPublicKeyAlgorithm === "function") {
        try {
            responsePublicKeyAlgorithm = response.getPublicKeyAlgorithm()
        } catch {
            throw new Error("getPublicKeyAlgorithm() is not supported")
        }
    }

    let responseAuthenticatorData: string | undefined
    if (typeof response.getAuthenticatorData === "function") {
        try {
            responseAuthenticatorData = Base64.fromBytes(
                new Uint8Array(response.getAuthenticatorData())
            )
        } catch {
            throw new Error("getAuthenticatorData() is not supported")
        }
    }

    const serverResponse = await request(
        {
            method: "pks_verifyRegistration",
            params: [
                {
                    id: credential.id,
                    rawId: Base64.fromBytes(
                        new Uint8Array(credential.raw.rawId),
                        {
                            pad: false,
                            url: true
                        }
                    ),
                    response: {
                        clientDataJSON: Base64.fromBytes(
                            new Uint8Array(response.clientDataJSON)
                        ),
                        attestationObject: Base64.fromBytes(
                            new Uint8Array(response.attestationObject),
                            {
                                url: true
                            }
                        ),
                        transports:
                            typeof response.getTransports === "function"
                                ? (response.getTransports() as (
                                      | "ble"
                                      | "cable"
                                      | "hybrid"
                                      | "internal"
                                      | "nfc"
                                      | "smart-card"
                                      | "usb"
                                  )[])
                                : undefined,
                        publicKeyAlgorithm: responsePublicKeyAlgorithm,
                        authenticatorData: responseAuthenticatorData
                    },
                    authenticatorAttachment: credential.raw
                        .authenticatorAttachment as
                        | "cross-platform"
                        | "platform",
                    clientExtensionResults:
                        credential.raw.getClientExtensionResults(),
                    type: credential.raw.type as "public-key"
                },
                context
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
        publicKey: publicKey as Hex.Hex,
        userName
    }
}
