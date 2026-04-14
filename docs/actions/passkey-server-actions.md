# Passkey Server Actions

Actions for managing WebAuthn/passkey credentials through a passkey server. Used with `createPasskeyServerClient`.

## Import

```typescript
import {
    startRegistration,
    verifyRegistration,
    getCredentials,
} from "permissionless/actions/passkeyServer"

import type {
    StartRegistrationParameters,
    StartRegistrationReturnType,
    VerifyRegistrationParameters,
    VerifyRegistrationReturnType,
    GetCredentialsParameters,
    GetCredentialsReturnType,
} from "permissionless/actions/passkeyServer"
```

---

## Registration Flow

### `startRegistration`

Initiates a WebAuthn credential registration with the passkey server.

**RPC method:** `pks_startRegistration`

```typescript
async function startRegistration(
    client: Client,
    args: StartRegistrationParameters
): Promise<StartRegistrationReturnType>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userName` | `string` | Yes | User identifier for the credential |

#### Returns

WebAuthn creation options to pass to the browser's `navigator.credentials.create()` API.

---

### `verifyRegistration`

Completes the registration by verifying the authenticator's response with the passkey server.

**RPC method:** `pks_verifyRegistration`

```typescript
async function verifyRegistration(
    client: Client,
    args: VerifyRegistrationParameters
): Promise<VerifyRegistrationReturnType>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `credential` | `object` | Yes | Authenticator response from `navigator.credentials.create()` |

#### Returns

```typescript
{
    success: boolean,
    id: string,
    publicKey: Hex,
    userName: string,
}
```

---

## Credential Management

### `getCredentials`

Retrieves all registered credentials for a user.

**RPC method:** `pks_getCredentials`

```typescript
async function getCredentials(
    client: Client,
    args: GetCredentialsParameters
): Promise<GetCredentialsReturnType>
```

#### Returns

```typescript
{ id: string, publicKey: Hex }[]
```

---

## Authentication Flow

The passkey server also supports authentication via `startAuthentication` and `verifyAuthentication` methods (available via the decorator, not exported standalone):

- **`startAuthentication`** (`pks_startAuthentication`) -- Gets authentication challenge options
- **`verifyAuthentication`** (`pks_verifyAuthentication`) -- Verifies the authenticator's response

## Example Flow

```typescript
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"
import { http } from "viem"

const passkeyClient = createPasskeyServerClient({
    transport: http("https://passkey-server.example.com"),
})

// 1. Start registration
const options = await passkeyClient.startRegistration({
    userName: "alice@example.com",
})

// 2. Browser creates credential (user interaction required)
const credential = await navigator.credentials.create({
    publicKey: options,
})

// 3. Verify with server
const result = await passkeyClient.verifyRegistration({
    credential,
})

console.log("Registered:", result.success)
console.log("Public key:", result.publicKey)

// 4. Use the public key to create a Safe account with WebAuthn
// (see Safe account documentation for WebAuthn owner setup)
```
