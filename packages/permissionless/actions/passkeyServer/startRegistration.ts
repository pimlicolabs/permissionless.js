import { Base64 } from "ox"
import type { Account, Chain, Client, Transport } from "viem"
import type { CreateWebAuthnCredentialParameters } from "viem/account-abstraction"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

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
    if (!extensions) return true
    if (typeof extensions !== "object") return false

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

export type StartRegistrationParameters = {
    context?: Record<string, unknown>
}
export type StartRegistrationReturnType = CreateWebAuthnCredentialParameters

export const startRegistration = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PasskeyServerRpcSchema
    >,
    args?: StartRegistrationParameters
): Promise<StartRegistrationReturnType> => {
    const response = await client.request({
        method: "pks_startRegistration",
        params: [args?.context]
    })

    // Validate the response matches expected schema
    if (
        !validateAttestation(response.attestation) ||
        !validateAuthenticatorSelection(response.authenticatorSelection) ||
        !validateChallenge(response.challenge) ||
        !validateExtensions(response.extensions) ||
        !validateRp(response.rp) ||
        !validateUser(response.user)
    ) {
        throw new Error("Invalid response format from passkey server")
    }

    const credentialOptions: StartRegistrationReturnType = {
        attestation: response.attestation,
        authenticatorSelection: response.authenticatorSelection,
        challenge: Base64.toBytes(response.challenge),
        extensions: response.extensions
            ? {
                  ...response.extensions
              }
            : undefined,
        rp: response.rp,
        timeout: response.timeout,
        user: {
            id: Base64.toBytes(response.user.id),
            name: response.user.name,
            displayName: response.user.displayName
        }
    }
    return credentialOptions
}
