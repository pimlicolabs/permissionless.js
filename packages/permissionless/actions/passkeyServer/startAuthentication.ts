import { getOxExports } from "../../utils/ox.js"
import {
    type Account,
    type Chain,
    type Client,
    type Transport,
    toHex
} from "viem"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

export type StartAuthenticationReturnType = {
    challenge: string
    rpId: string
    userVerification?: string
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
        challenge: toHex((await getOxExports()).Base64.toBytes(response.challenge)),
        rpId: response.rpId,
        userVerification: response.userVerification,
        uuid: response.uuid
    }
}
