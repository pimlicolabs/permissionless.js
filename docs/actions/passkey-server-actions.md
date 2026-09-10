# Passkey Server Actions

Actions for registering and authenticating WebAuthn credentials against a Pimlico passkey server. They live on the `PasskeyServer` namespace in `permissionless/pimlico`; `PasskeyServerClient.create` attaches them as methods.

## Import

```typescript
import { PasskeyServer } from "permissionless/pimlico"
import type { PasskeyServer } from "permissionless/pimlico"
// PasskeyServer.Actions,
// PasskeyServer.StartRegistrationParameters, PasskeyServer.StartRegistrationReturnType,
// PasskeyServer.VerifyRegistrationParameters, PasskeyServer.VerifyRegistrationReturnType,
// PasskeyServer.GetCredentialsParameters, PasskeyServer.GetCredentialsReturnType,
// PasskeyServer.StartAuthenticationReturnType,
// PasskeyServer.VerifyAuthenticationParameters, PasskeyServer.VerifyAuthenticationReturnType
```

Every action takes a client whose `request` speaks the passkey server RPC; `PasskeyServerClient.create` builds one.

---

## Registration Flow

### `PasskeyServer.startRegistration`

Asks the server for WebAuthn creation options.

**RPC method:** `pks_startRegistration`

```typescript
async function PasskeyServer.startRegistration(
    client: Client,
    args?: PasskeyServer.StartRegistrationParameters
): Promise<PasskeyServer.StartRegistrationReturnType>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `context` | `Record<string, unknown>` | No | Opaque context forwarded to the server (for example `{ userName }`) |

#### Returns

`WebAuthn.createCredential.Options` (`viem/utils`), ready for `WebAuthn.createCredential` in the browser.

---

### `PasskeyServer.verifyRegistration`

Completes the registration with the created credential.

**RPC method:** `pks_verifyRegistration`

```typescript
async function PasskeyServer.verifyRegistration(
    client: Client,
    args: PasskeyServer.VerifyRegistrationParameters
): Promise<PasskeyServer.VerifyRegistrationReturnType>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `credential` | `WebAuthn.P256Credential` | Yes | Result of `WebAuthn.createCredential` |
| `context` | `unknown` | Yes | Context forwarded to the server |

#### Returns

```typescript
{
    success: boolean
    id: string
    publicKey: Hex
    userName: string
}
```

---

## Credential Management

### `PasskeyServer.getCredentials`

**RPC method:** `pks_getCredentials`

```typescript
async function PasskeyServer.getCredentials(
    client: Client,
    args?: PasskeyServer.GetCredentialsParameters
): Promise<PasskeyServer.GetCredentialsReturnType>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `context` | `Record<string, unknown>` | No | Context forwarded to the server |

Returns `{ id: string, publicKey: Hex }[]`.

---

## Authentication Flow

### `PasskeyServer.startAuthentication`

**RPC method:** `pks_startAuthentication`

```typescript
async function PasskeyServer.startAuthentication(
    client: Client
): Promise<PasskeyServer.StartAuthenticationReturnType>
```

Returns `{ challenge: string, rpId: string, uuid: string, userVerification?: string }` for `navigator.credentials.get`.

### `PasskeyServer.verifyAuthentication`

**RPC method:** `pks_verifyAuthentication`

```typescript
async function PasskeyServer.verifyAuthentication(
    client: Client,
    args: PasskeyServer.VerifyAuthenticationParameters
): Promise<PasskeyServer.VerifyAuthenticationReturnType>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raw` | The `PublicKeyCredential` returned by `navigator.credentials.get` (`id`, `rawId`, `authenticatorAttachment`, `response`, `getClientExtensionResults`, `type`) | Yes | Assertion to verify |
| `uuid` | `string` | Yes | The `uuid` returned by `startAuthentication` |

Returns `{ success, id, publicKey, userName }`.

---

## Errors

- `InvalidPasskeyServerResponseError` -- a server response failed validation; `metaMessages` names the method and reason
- `InvalidPasskeyCredentialError` -- `verifyAuthentication` with a response lacking `authenticatorData` or `signature`
- `PasskeyAttestationUnsupportedError` -- `verifyRegistration` when the browser cannot expose the public key algorithm or authenticator data

## Example Flow

```typescript
import { http } from "viem"
import { WebAuthn } from "viem/utils"
import { PasskeyServerClient } from "permissionless/pimlico"

const passkeyClient = PasskeyServerClient.create({
    transport: http("https://passkey-server.example.com")
})

// 1. Start registration
const options = await passkeyClient.startRegistration({
    context: { userName: "alice@example.com" }
})

// 2. Browser creates the credential (user interaction)
const credential = await WebAuthn.createCredential(options)

// 3. Verify with the server
const { id, publicKey } = await passkeyClient.verifyRegistration({
    credential,
    context: { userName: "alice@example.com" }
})

// 4. Later: list credentials
const credentials = await passkeyClient.getCredentials({
    context: { userName: "alice@example.com" }
})
```

## Migrating from 0.x

- The `actions/passkeyServer` subpath -> the `PasskeyServer` namespace in `permissionless/pimlico`.
- `startAuthentication` and `verifyAuthentication` are exported standalone now (0.x had them on the decorator only).
