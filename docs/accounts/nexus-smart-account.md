# NexusSmartAccount

The Nexus smart account is a modular ERC-7579 account with attestation support, designed as the successor to the Biconomy account.

## Import

```typescript
import { NexusSmartAccount } from "permissionless"
```

## Constructor

```typescript
async function NexusSmartAccount.from(
    parameters: NexusSmartAccount.Parameters
): Promise<NexusSmartAccount.ReturnType>
```

Types: `NexusSmartAccount.Parameters`, `NexusSmartAccount.ReturnType`, `NexusSmartAccount.Implementation`, `NexusSmartAccount.Version`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client` | `Client.Client` | Yes | -- | viem client for on-chain reads |
| `owner` | `Account.Local \| Client (wallet) \| EthereumProvider` | Yes | -- | Key that signs UserOperations |
| `version` | `"1.0.0"` | No | `"1.0.0"` | Account version |
| `entryPoint` | `"0.7" \| { address: Address, version: "0.7" }` | No | `"0.7"` | EntryPoint to use (0.7 only) |
| `address` | `Address` | No | Computed | Override counterfactual address |
| `index` | `bigint` | No | `0n` | Salt for deterministic address |
| `factoryAddress` | `Address` | No | `0x00000bb19a3579F4D779215dEf97AFbd0e30DB55` | K1 validator factory |
| `validatorAddress` | `Address` | No | `0x00000004171351c442B202678c48D8AB5B321E8f` | K1 validator |
| `attesters` | `Address[]` | No | `[]` | Trusted attesters for module deployment, sorted byte-wise before encoding |
| `threshold` | `number` | No | `0` | Attestation threshold |
| `nonceKey` | `bigint` | No | `0n` | Default nonce key; a per-call `getNonce({ key })` wins |

## Supported EntryPoint Versions

- **0.7** only

## Implementation Details

- **ERC-7579:** Full support (uses `encode7579Calls` for execution encoding)
- **ERC-1271:** Full support for `signMessage` and `signTypedData`
- **Attestation:** Supports specifying trusted attesters and threshold for module validation
- **Nonce key:** `getNonce({ key })` → constructor `nonceKey` → `0n`, packed into Nexus's 3-byte key field ahead of the validator address

## Example

```typescript
import { Account, Client, http } from "viem"
import { sepolia } from "viem/chains"
import { NexusSmartAccount } from "permissionless"

const account = await NexusSmartAccount.from({
    client: Client.create({ chain: sepolia, transport: http() }),
    owner: Account.fromPrivateKey("0x..."),
})
```

### With Attesters

```typescript
const account = await NexusSmartAccount.from({
    client: publicClient,
    owner,
    attesters: ["0xAttester1...", "0xAttester2..."],
    threshold: 1,
})
```
