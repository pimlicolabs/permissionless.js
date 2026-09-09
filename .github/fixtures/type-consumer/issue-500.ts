// Guards for issue #500: SmartAccountClient.create's precise return type must
// stay assignable to the bare SmartAccountClient.Client alias cheaply (variance
// fast path) WITHOUT the fix widening the return type. The Equal assertions fail if
// the return type ever collapses to the loose defaults (or any) — which is
// what the rejected fix in PR #511 would have done — and the bare-alias
// assignments fail if the variance restructure ever rejects something the old
// structural check accepted.
import { SmartAccountClient } from "permissionless"
import { PasskeyServerClient, PimlicoClient } from "permissionless/pimlico"
import { type Client, http, type Transport } from "viem"
import { sepolia } from "viem/chains"
import { EntryPoint, type SmartAccount } from "viem/erc4337"
import type { RpcSchema } from "viem/utils"

type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
        ? true
        : false
type Expect<T extends true> = T

const pimlicoClient = PimlicoClient.create({
    transport: http("https://bundler.invalid"),
    entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
})

// A precisely typed account stands in for the permissionless account
// constructors until the account port tickets land.
type Account = SmartAccount.SmartAccount<
    SmartAccount.Implementation<
        typeof EntryPoint.abiV07,
        "0.7",
        { label: "test" }
    >
>
declare const account: Account

export function makeClient() {
    return SmartAccountClient.create({
        account,
        chain: sepolia,
        bundlerTransport: http("https://bundler.invalid"),
        paymaster: pimlicoClient,
        userOperation: {
            estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast
        }
    })
}

type PreciseClient = ReturnType<typeof makeClient>
declare const precise: PreciseClient

// The #500 hot path: precise instantiation → bare alias.
export const bare: SmartAccountClient.Client = precise

// Return-type precision is unchanged — everything PR #511 would have widened.
export type AccountIsExact = Expect<Equal<PreciseClient["account"], Account>>
export type ChainIsExact = Expect<Equal<PreciseClient["chain"], typeof sepolia>>
export type ClientSlotIsExact = Expect<
    Equal<PreciseClient["client"], undefined>
>

// A custom schema must still assign to the bare alias. viem 3's Bundler
// Client shape is not structurally assignable across differing schema
// arguments (its `extend(...).userOperation` is invariant in `account`), so
// the alias annotates `rpcSchema` as `out` with the widest default
// (`RpcSchema.Generic`) and this assignment rides the variance fast path.
type CustomRpcSchema = RpcSchema.From<{
    Request: { method: "custom_method"; params: [value: string] }
    ReturnType: string
}>
declare const withCustomSchema: SmartAccountClient.Client<
    Transport.Transport,
    typeof sepolia,
    Account,
    undefined,
    CustomRpcSchema
>
export const bareFromCustomSchema: SmartAccountClient.Client = withCustomSchema

// Same guarantees for PimlicoClient (fixed alongside, identical pathology).
export const barePimlico: PimlicoClient.Client = pimlicoClient
export type PimlicoChainIsExact = Expect<
    Equal<(typeof pimlicoClient)["chain"], undefined>
>

// Same guarantees for PasskeyServerClient (same inline-mapped restructure).
const passkeyClient = PasskeyServerClient.create({
    transport: http("https://passkeys.invalid")
})
export const barePasskey: PasskeyServerClient.Client = passkeyClient
declare const passkeyWithCustomSchema: PasskeyServerClient.Client<CustomRpcSchema>
export const barePasskeyFromCustomSchema: PasskeyServerClient.Client =
    passkeyWithCustomSchema

// The precise client still satisfies structural consumers that were never
// spelled as the alias (no aliasSymbol on either side → structural path).
declare const plainViemClient: ReturnType<typeof Client.create>
export const clientSlotAccepts: SmartAccountClient.Client["client"] =
    plainViemClient
