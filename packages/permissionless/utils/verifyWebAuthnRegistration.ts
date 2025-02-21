import { Base64 } from "ox"
import type { Hex } from "viem"
import type { CreateWebAuthnCredentialReturnType } from "viem/account-abstraction"

export const verifyWebAuthnRegistration = async ({
    passKeyServerUrl,
    credential,
    userName
}: {
    passKeyServerUrl: string
    credential: CreateWebAuthnCredentialReturnType
    userName: string
}): Promise<{
    success: boolean
    id: string
    publicKey: Hex
}> => {
    const response = credential.raw
        .response as unknown as AuthenticatorAttestationResponse

    let responsePublicKeyAlgorithm: number | undefined = undefined
    if (typeof response.getPublicKeyAlgorithm === "function") {
        try {
            responsePublicKeyAlgorithm = response.getPublicKeyAlgorithm()
        } catch (error) {
            throw new Error("getPublicKeyAlgorithm() is not supported")
        }
    }

    let responseAuthenticatorData: string | undefined
    if (typeof response.getAuthenticatorData === "function") {
        try {
            responseAuthenticatorData = Base64.fromBytes(
                new Uint8Array(response.getAuthenticatorData())
            )
        } catch (error) {
            throw new Error("getAuthenticatorData() is not supported")
        }
    }

    const serverResponse = await (
        await fetch(passKeyServerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: credential.id,
                rawId: Base64.fromBytes(new Uint8Array(credential.raw.rawId), {
                    pad: false,
                    url: true
                }),
                userName: userName,
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
                            ? response.getTransports()
                            : undefined,
                    publicKeyAlgorithm: responsePublicKeyAlgorithm,
                    authenticatorData: responseAuthenticatorData
                },
                authenticatorAttachment: credential.raw.authenticatorAttachment,
                clientExtensionResults:
                    credential.raw.getClientExtensionResults(),
                type: credential.raw.type
            })
        })
    ).json()

    const success = Boolean(serverResponse?.success)
    const id = serverResponse?.id
    const publicKey = serverResponse?.publicKey

    if (typeof id !== "string") {
        throw new Error("Invalid passkey id returned from server")
    }

    if (typeof publicKey !== "string" || !publicKey.startsWith("0x")) {
        throw new Error(
            "Invalid public key returned from server - must be hex string starting with 0x"
        )
    }

    return {
        success,
        id,
        publicKey: publicKey as Hex
    }
}
