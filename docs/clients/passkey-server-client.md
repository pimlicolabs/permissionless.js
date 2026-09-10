# PasskeyServerClient

`PasskeyServerClient` is a viem 3 `Client` against a Pimlico passkey server with the `PasskeyServer` actions (registration, authentication, credential lookup) attached.

## Import

```typescript
import { PasskeyServerClient } from "permissionless/pimlico"
import type { PasskeyServerClient } from "permissionless/pimlico"
// PasskeyServerClient.Client, PasskeyServerClient.Config, PasskeyServerClient.Schema
```

## `PasskeyServerClient.create`

```typescript
function PasskeyServerClient.create(
    parameters: PasskeyServerClient.Config
): PasskeyServerClient.Client
```

Generic over the extra RPC schema.

### Config

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `transport` | `Transport.Transport` | Yes | -- | Transport to the passkey server |
| `chain` | `Chain.Chain` | No | -- | Chain |
| `account` | `Account.Account` | No | -- | Account |
| `key` | `string` | No | `"public"` | Client key |
| `name` | `string` | No | `"Passkey Server Client"` | Client name |
| `cacheTime` | `number` | No | viem default | Cache duration |
| `pollingInterval` | `number` | No | viem default | Polling interval |
| `schema` | `RpcSchema.Generic` | No | -- | Extra typed RPC methods |

### Return Type

`PasskeyServerClient.Client` is a viem `Client` (type `"passkeyServerClient"`) with `PasskeyServer.Actions`:

- `startRegistration({ context? })` -- WebAuthn creation options
- `verifyRegistration({ credential, context })` -- complete registration
- `getCredentials({ context? })` -- registered credentials
- `startAuthentication()` -- authentication challenge
- `verifyAuthentication({ raw, uuid })` -- complete authentication

See [Passkey Server Actions](../actions/passkey-server-actions.md).

### Internal Implementation

```typescript
Client.create({ ...parameters, key, name, type: "passkeyServerClient" })
    .extend(passkeyServerActions)
```

## Example

```typescript
import { http } from "viem"
import { WebAuthn } from "viem/utils"
import { PasskeyServerClient } from "permissionless/pimlico"

const passkeyClient = PasskeyServerClient.create({
    transport: http("https://passkey-server.example.com")
})

const options = await passkeyClient.startRegistration({
    context: { userName: "alice" }
})

const credential = await WebAuthn.createCredential(options)

const result = await passkeyClient.verifyRegistration({
    credential,
    context: { userName: "alice" }
})
```
