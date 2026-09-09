import type { Client, Transport } from "viem"
import { Hex } from "viem/utils"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"
import * as Base64 from "../../utils/base64.js"

export type StartAuthenticationReturnType = {
    challenge: string
    rpId: string
    userVerification?: string
    uuid: string
}

export const startAuthentication = async (
    client: Pick<Client.Client, "request">
): Promise<StartAuthenticationReturnType> => {
    const request =
        client.request as Transport.RequestFn<PasskeyServerRpcSchema>
    const response = await request({
        method: "pks_startAuthentication"
    })

    return {
        challenge: Hex.fromBytes(Base64.toBytes(response.challenge)),
        rpId: response.rpId,
        userVerification: response.userVerification,
        uuid: response.uuid
    }
}
