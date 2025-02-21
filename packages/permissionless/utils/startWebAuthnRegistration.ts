import { Base64 } from "ox"
import type { CreateWebAuthnCredentialParameters } from "viem/account-abstraction"

const validateAttestation = (attestation: unknown): boolean => {
    return (
        !!attestation &&
        ["direct", "enterprise", "indirect", "none"].includes(
            attestation as string
        )
    )
}

const validateAuthenticatorSelection = (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    authenticatorSelection: any
): boolean => {
    if (!authenticatorSelection) return false

    const validAttachments = ["platform", "cross-platform"]
    const validKeyOptions = ["required", "preferred", "discouraged"]

    return (
        validAttachments.includes(
            authenticatorSelection.authenticatorAttachment
        ) &&
        typeof authenticatorSelection.requireResidentKey === "boolean" &&
        validKeyOptions.includes(authenticatorSelection.residentKey) &&
        validKeyOptions.includes(authenticatorSelection.userVerification)
    )
}

const validateChallenge = (challenge: unknown): boolean => {
    return !!challenge && typeof challenge === "string"
}

const validateExtensions = (extensions: unknown): boolean => {
    if (!extensions || typeof extensions !== "object") return false

    const ext = extensions as Record<string, unknown>

    // Optional appid must be string if present
    if ("appid" in ext && typeof ext.appid !== "string") return false

    // Optional credProps must be boolean if present
    if ("credProps" in ext && typeof ext.credProps !== "boolean") return false

    // Optional hmacCreateSecret must be boolean if present
    if ("hmacCreateSecret" in ext && typeof ext.hmacCreateSecret !== "boolean")
        return false

    // Optional minPinLength must be boolean if present
    if ("minPinLength" in ext && typeof ext.minPinLength !== "boolean")
        return false

    // Optional prf must have valid eval.first string if present
    if ("prf" in ext) {
        const prf = ext.prf as Record<string, unknown>
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        if (!prf?.eval || typeof (prf.eval as any).first !== "string")
            return false
    }

    // Optional largeBlob must have valid support enum if present
    if ("largeBlob" in ext) {
        const blob = ext.largeBlob as Record<string, unknown>
        if (
            !blob?.support ||
            !["required", "preferred"].includes(blob.support as string)
        )
            return false
    }

    return true
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const validateRp = (rp: any): boolean => {
    return !!rp && typeof rp.id === "string" && typeof rp.name === "string"
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const validateUser = (user: any): boolean => {
    return (
        !!user &&
        typeof user.id === "string" &&
        typeof user.name === "string" &&
        typeof user.displayName === "string"
    )
}

export const startWebAuthnRegistration = async ({
    passKeyServerUrl,
    userName
}: {
    passKeyServerUrl: string
    userName: string
}): Promise<CreateWebAuthnCredentialParameters> => {
    const response = await fetch(passKeyServerUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userName
        })
    })

    if (!response.ok) {
        throw new Error("Failed to register passkey", {
            cause: response
        })
    }

    const jsonResponse = await response.json()

    // Validate the response matches expected schema
    if (
        !validateAttestation(jsonResponse.attestation) ||
        !validateAuthenticatorSelection(jsonResponse.authenticatorSelection) ||
        !validateChallenge(jsonResponse.challenge) ||
        !validateExtensions(jsonResponse.extensions) ||
        !validateRp(jsonResponse.rp) ||
        !validateUser(jsonResponse.user)
    ) {
        throw new Error("Invalid response format from passkey server")
    }

    const credentialOptions: CreateWebAuthnCredentialParameters = {
        attestation: jsonResponse.attestation,
        authenticatorSelection: jsonResponse.authenticatorSelection,
        challenge: Base64.toBytes(jsonResponse.challenge),
        extensions: {
            ...jsonResponse.extensions,
            prf: jsonResponse.extensions?.prf
                ? {
                      eval: {
                          first: Base64.toBytes(
                              jsonResponse.extensions.prf.eval.first
                          )
                      }
                  }
                : undefined
        },
        rp: jsonResponse.rp,
        timeout: jsonResponse.timeout,
        user: {
            id: Base64.toBytes(jsonResponse.user.id),
            name: jsonResponse.user.name,
            displayName: jsonResponse.user.displayName
        }
    }
    return credentialOptions
}
