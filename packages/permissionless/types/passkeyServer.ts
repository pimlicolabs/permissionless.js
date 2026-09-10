import type { Hex, RpcSchema } from "viem/utils"

export type PasskeyServerRpcSchema = RpcSchema.From<
    | {
          Request: {
              method: "pks_startAuthentication"
              params?: undefined
          }
          ReturnType: {
              challenge: string
              rpId: string
              timeout?: number
              userVerification?: "required" | "preferred" | "discouraged"
              uuid: string
          }
      }
    | {
          Request: {
              method: "pks_startRegistration"
              params: [context: unknown]
          }
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
      }
    | {
          Request: {
              method: "pks_verifyRegistration"
              params: [
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
          }
          ReturnType: {
              success: boolean
              id: string
              publicKey: Hex.Hex
              userName: string
          }
      }
    | {
          Request: {
              method: "pks_verifyAuthentication"
              params: [
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
          }
          ReturnType: {
              success: boolean
              id: string
              publicKey: Hex.Hex
              userName: string
          }
      }
    | {
          Request: {
              method: "pks_getCredentials"
              params: [context: unknown]
          }
          ReturnType: {
              id: string
              publicKey: Hex.Hex
          }[]
      }
>
