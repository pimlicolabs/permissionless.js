import type { Client, Transport } from "viem"
import type { WebAuthn } from "viem/utils"
import { InvalidPasskeyServerResponseError } from "../../errors/passkeyServer.js"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"
import * as Base64 from "../../utils/base64.js"

const validateAttestation = (attestation: unknown): boolean => {
    return (
        !!attestation &&
        ["direct", "enterprise", "indirect", "none"].includes(
            attestation as string
        )
    )
}

const validateAuthenticatorSelection = (
    authenticatorSelection: unknown
): boolean => {
    if (!authenticatorSelection || typeof authenticatorSelection !== "object")
        return false

    const selection = authenticatorSelection as Record<string, unknown>
    const validAttachments = ["platform", "cross-platform"]
    const validKeyOptions = new Set(["required", "preferred", "discouraged"])

    return (
        validAttachments.includes(
            selection.authenticatorAttachment as string
        ) &&
        typeof selection.requireResidentKey === "boolean" &&
        validKeyOptions.has(selection.residentKey as string) &&
        validKeyOptions.has(selection.userVerification as string)
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

const validateRp = (rp: unknown): boolean => {
    if (!rp || typeof rp !== "object") return false
    const { id, name } = rp as Record<string, unknown>
    return typeof id === "string" && typeof name === "string"
}

const validateUser = (user: unknown): boolean => {
    if (!user || typeof user !== "object") return false
    const { id, name, displayName } = user as Record<string, unknown>
    return (
        typeof id === "string" &&
        typeof name === "string" &&
        typeof displayName === "string"
    )
}

export type StartRegistrationParameters = {
    context?: Record<string, unknown>
}
export type StartRegistrationReturnType = WebAuthn.createCredential.Options

export const startRegistration: (
    client: Pick<Client.Client, "request">,
    args?: StartRegistrationParameters
) => Promise<StartRegistrationReturnType> = async (client, args) => {
    const request =
        client.request as Transport.RequestFn<PasskeyServerRpcSchema>
    const response = await request({
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
        throw new InvalidPasskeyServerResponseError({
            method: "pks_startRegistration",
            reason: "Malformed credential creation options."
        })
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
