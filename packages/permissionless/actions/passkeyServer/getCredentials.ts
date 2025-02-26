import type { Account, Chain, Client, Hex, Transport } from "viem"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

export type GetCredentialsParameters = {
    context?: Record<string, unknown>
}

export type GetCredentialsReturnType = {
    id: string
    publicKey: Hex
}[]

export const getCredentials = async (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PasskeyServerRpcSchema
    >,
    args?: GetCredentialsParameters
): Promise<GetCredentialsReturnType> => {
    const response = await client.request({
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
