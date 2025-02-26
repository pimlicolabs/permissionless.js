import {
    type StartRegistrationParameters,
    type StartRegistrationReturnType,
    startRegistration
} from "./passkeyServer/startRegistration.js"

import {
    type VerifyRegistrationParameters,
    type VerifyRegistrationReturnType,
    verifyRegistration
} from "./passkeyServer/verifyRegistration.js"

import {
    type GetCredentialsParameters,
    type GetCredentialsReturnType,
    getCredentials
} from "./passkeyServer/getCredentials.js"

export {
    type StartRegistrationParameters,
    type StartRegistrationReturnType,
    type VerifyRegistrationParameters,
    type VerifyRegistrationReturnType,
    type GetCredentialsParameters,
    type GetCredentialsReturnType,
    startRegistration,
    verifyRegistration,
    getCredentials
}
