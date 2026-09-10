import type { Client, Transport } from "viem"
import type { Hex } from "viem/utils"
import { InvalidPasskeyServerResponseError } from "../../errors/passkeyServer.js"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

export type GetCredentialsParameters = {
    context?: Record<string, unknown>
}

export type GetCredentialsReturnType = {
    id: string
    publicKey: Hex.Hex
}[]

export const getCredentials = async (
    client: Pick<Client.Client, "request">,
    args?: GetCredentialsParameters
): Promise<GetCredentialsReturnType> => {
    const request =
        client.request as Transport.RequestFn<PasskeyServerRpcSchema>
    const response = await request({
        method: "pks_getCredentials",
        params: [args?.context]
    })

    const invalid = (reason: string) =>
        new InvalidPasskeyServerResponseError({
            method: "pks_getCredentials",
            reason
        })
    if (!Array.isArray(response)) throw invalid("Expected an array.")
    for (const passkey of response) {
        if (typeof passkey?.id !== "string")
            throw invalid("`id` must be a string.")
        if (
            typeof passkey?.publicKey !== "string" ||
            !passkey.publicKey.startsWith("0x")
        )
            throw invalid("`publicKey` must be a 0x-prefixed hex string.")
    }

    return response
}
