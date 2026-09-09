import type { Client, Transport } from "viem"
import type { Hex } from "viem/utils"
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

    if (!Array.isArray(response)) {
        throw new Error("Invalid response from server - expected array")
    }

    for (const passkey of response) {
        if (typeof passkey?.id !== "string") {
            throw new Error("Invalid passkey id returned from server")
        }

        if (
            typeof passkey?.publicKey !== "string" ||
            !passkey.publicKey.startsWith("0x")
        ) {
            throw new Error(
                "Invalid public key returned from server - must be hex string starting with 0x"
            )
        }
    }

    return response
}
