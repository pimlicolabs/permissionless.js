# PasskeyServerClient

The `PasskeyServerClient` provides methods for interacting with a WebAuthn/passkey server for credential registration and authentication.

## Import

```typescript
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"
import type {
    PasskeyServerClient,
    PasskeyServerClientConfig,
} from "permissionless/clients/passkeyServer"
```

## `createPasskeyServerClient`

```typescript
function createPasskeyServerClient<
    rpcSchema extends RpcSchema | undefined = undefined
>(
    parameters: PasskeyServerClientConfig<rpcSchema>
): PasskeyServerClient<rpcSchema>
```

### Config Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `transport` | `Transport` | Yes | -- | Transport to the passkey server |
| `chain` | `Chain` | No | -- | Chain |
| `account` | `Account` | No | -- | Account |
| `key` | `string` | No | `"public"` | Client key |
| `name` | `string` | No | `"Passkey Server Client"` | Client name |
| `cacheTime` | `number` | No | viem default | Cache duration |
| `pollingInterval` | `number` | No | viem default | Polling interval |
| `rpcSchema` | `RpcSchema` | No | -- | Additional RPC methods |

### Return Type

`PasskeyServerClient` is a viem `Client` with `PasskeyServerActions`:
- `startRegistration` -- Begin WebAuthn credential registration
- `verifyRegistration` -- Complete registration with authenticator response
- `getCredentials` -- List registered credentials
- `startAuthentication` -- Begin authentication challenge
- `verifyAuthentication` -- Complete authentication

See [Passkey Server Actions](../actions/passkey-server-actions.md) for details on each method.

### Internal Implementation

```typescript
createClient({ ...parameters })
    .extend(passkeyServerActions)
```

## Example

```typescript
import { http } from "viem"
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"

const passkeyClient = createPasskeyServerClient({
    transport: http("https://passkey-server.example.com"),
})

// Register a new passkey
const registrationOptions = await passkeyClient.startRegistration({
    userName: "alice",
})

// After user completes WebAuthn ceremony:
const result = await passkeyClient.verifyRegistration({
    credential: authenticatorResponse,
})
```
