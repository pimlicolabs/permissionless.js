import type { Hex } from "viem"

export type PasskeyServerRpcSchema = [
    {
        Method: "pks_startAuthentication"
        Parameters: []
        ReturnType: {
            challenge: string
            rpId: string
            timeout?: number
            userVerification?: "required" | "preferred" | "discouraged"
            uuid: string
        }
    },
    {
        Method: "pks_startRegistration"
        Parameters: [context: unknown]
        ReturnType: {
            rp: {
                id: string
                name: string
            }
            user: {
                id: string
                name: string
                displayName: string
            }
            challenge: string
            timeout?: number
            authenticatorSelection?: {
                authenticatorAttachment?: "platform" | "cross-platform"
                requireResidentKey?: boolean
                residentKey?: "required" | "preferred" | "discouraged"
                userVerification?: "required" | "preferred" | "discouraged"
            }
            attestation: "direct" | "enterprise" | "indirect" | "none"
            extensions?: {
                appid?: string
                credProps?: boolean
                hmacCreateSecret?: boolean
                minPinLength?: boolean
            }
        }
    },
    {
        Method: "pks_verifyRegistration"
        Parameters: [
            {
                id: string
                rawId: string
                response: {
                    clientDataJSON: string
                    attestationObject: string
                    authenticatorData?: string
                    transports?: (
                        | "ble"
                        | "cable"
                        | "hybrid"
                        | "internal"
                        | "nfc"
                        | "smart-card"
                        | "usb"
                    )[]
                    publicKeyAlgorithm?: number
                    publicKeyType?: string
                }
                authenticatorAttachment: "cross-platform" | "platform"
                clientExtensionResults: {
                    appid?: boolean
                    credProps?: {
                        rk?: boolean
                    }
                    hmacCreateSecret?: boolean
                }
                type: "public-key"
            },
            context: unknown
        ]
        ReturnType: {
            success: boolean
            id: string
            publicKey: Hex
            userName: string
        }
    },
    {
        Method: "pks_verifyAuthentication"
        Parameters: [
            {
                id: string
                rawId: string
                response: {
                    clientDataJSON: string
                    authenticatorData: string
                    signature: string
                    userHandle?: string
                }
                authenticatorAttachment: "cross-platform" | "platform"
                clientExtensionResults: {
                    appid?: boolean
                    credProps?: {
                        rk?: boolean
                    }
                    hmacCreateSecret?: boolean
                }
                type: "public-key"
            },
            context: unknown
        ]
        ReturnType: {
            success: boolean
            id: string
            publicKey: Hex
            userName: string
        }
    },
    {
        Method: "pks_getCredentials"
        Parameters: [context: unknown]
        ReturnType: {
            id: string
            publicKey: Hex
        }[]
    }
]
