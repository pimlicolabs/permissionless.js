import type { Account, Chain, Client, Transport } from "viem"
import {
    type GetCredentialsParameters,
    type GetCredentialsReturnType,
    getCredentials
} from "../../actions/passkeyServer/getCredentials.js"
import {
    type StartRegistrationParameters,
    type StartRegistrationReturnType,
    startRegistration
} from "../../actions/passkeyServer/startRegistration.js"
import {
    type VerifyRegistrationParameters,
    type VerifyRegistrationReturnType,
    verifyRegistration
} from "../../actions/passkeyServer/verifyRegistration.js"
import type { PasskeyServerRpcSchema } from "../../types/passkeyServer.js"

export type PasskeyServerActions = {
    startRegistration: (
        args: StartRegistrationParameters
    ) => Promise<StartRegistrationReturnType>
    verifyRegistration: (
        args: VerifyRegistrationParameters
    ) => Promise<VerifyRegistrationReturnType>
    getCredentials: (
        args: GetCredentialsParameters
    ) => Promise<GetCredentialsReturnType>
}

export const passkeyServerActions = (
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PasskeyServerRpcSchema
    >
): PasskeyServerActions => ({
    startRegistration: (args) => startRegistration(client, args),
    verifyRegistration: (args) => verifyRegistration(client, args),
    getCredentials: (args) => getCredentials(client, args)
})
