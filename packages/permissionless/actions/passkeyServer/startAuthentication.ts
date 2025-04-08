import { Base64 } from "ox"
import type { WebAuthnP256 } from "ox"
import {
    type Account,
    type Chain,
    type Client,
    type Transport,
    toHex
} from "viem"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

export type StartAuthenticationReturnType = WebAuthnP256.sign.Options & {
    uuid: string
}

export const startAuthentication = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PasskeyServerRpcSchema
    >
): Promise<StartAuthenticationReturnType> => {
    const response = await client.request({
        method: "pks_startAuthentication",
        params: []
    })

    return {
        challenge: toHex(Base64.toBytes(response.challenge)),
        rpId: response.rpId,
        userVerification: response.userVerification,
        uuid: response.uuid
    }
}
