// Guards for issue #500: createSmartAccountClient's precise return type must
// stay assignable to the bare SmartAccountClient alias cheaply (variance fast
// path) WITHOUT the fix widening the return type. The Equal assertions fail if
// the return type ever collapses to the loose defaults (or any) — which is
// what the rejected fix in PR #511 would have done — and the bare-alias
// assignments fail if the variance restructure ever rejects something the old
// structural check accepted.
import {
    createSmartAccountClient,
    type SmartAccountClient
} from "permissionless"
import {
    type ToSimpleSmartAccountReturnType,
    toSimpleSmartAccount
} from "permissionless/accounts"
import {
    createPasskeyServerClient,
    type PasskeyServerClient
} from "permissionless/clients/passkeyServer"
import {
    createPimlicoClient,
    type PimlicoClient
} from "permissionless/clients/pimlico"
import {
    type createClient,
    createPublicClient,
    http,
    type Transport
} from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"

type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
        ? true
        : false
type Expect<T extends true> = T

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.invalid")
})

const pimlicoClient = createPimlicoClient({
    transport: http("https://bundler.invalid"),
    entryPoint: { address: entryPoint07Address, version: "0.7" }
})

export async function makeClient() {
    const account = await toSimpleSmartAccount({
        client: publicClient,
        owner: privateKeyToAccount(`0x${"11".repeat(32)}` as `0x${string}`),
        entryPoint: { address: entryPoint07Address, version: "0.7" }
    })

    return createSmartAccountClient({
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

type PreciseClient = Awaited<ReturnType<typeof makeClient>>
declare const precise: PreciseClient

// The #500 hot path: precise instantiation → bare alias.
export const bare: SmartAccountClient = precise

// Return-type precision is unchanged — everything PR #511 would have widened.
export type AccountIsExact = Expect<
    Equal<PreciseClient["account"], ToSimpleSmartAccountReturnType<"0.7">>
>
export type ChainIsExact = Expect<Equal<PreciseClient["chain"], typeof sepolia>>
export type ClientSlotIsExact = Expect<
    Equal<PreciseClient["client"], undefined>
>

// A custom rpcSchema must still assign to the bare alias. Its type argument
// differs from the bare default (`undefined`), so the variance fast path
// cannot decide this pairwise — it must fall back to the structural check.
// This line breaks loudly if `rpcSchema` ever gets a variance annotation (or
// a future TypeScript starts measuring it) in a way that hard-rejects first.
type CustomRpcSchema = [
    { Method: "custom_method"; Parameters: [value: string]; ReturnType: string }
]
declare const withCustomSchema: SmartAccountClient<
    Transport,
    typeof sepolia,
    ToSimpleSmartAccountReturnType<"0.7">,
    undefined,
    CustomRpcSchema
>
export const bareFromCustomSchema: SmartAccountClient = withCustomSchema

// Same guarantees for PimlicoClient (fixed alongside, identical pathology).
export const barePimlico: PimlicoClient = pimlicoClient
export type PimlicoChainIsExact = Expect<
    Equal<(typeof pimlicoClient)["chain"], undefined>
>

// Same guarantees for PasskeyServerClient (same inline-mapped restructure).
const passkeyClient = createPasskeyServerClient({
    transport: http("https://passkeys.invalid")
})
export const barePasskey: PasskeyServerClient = passkeyClient
declare const passkeyWithCustomSchema: PasskeyServerClient<CustomRpcSchema>
export const barePasskeyFromCustomSchema: PasskeyServerClient =
    passkeyWithCustomSchema

// The precise client still satisfies structural consumers that were never
// spelled as the alias (no aliasSymbol on either side → structural path).
declare const plainViemClient: ReturnType<typeof createClient>
export const clientSlotAccepts: SmartAccountClient["client"] = plainViemClient
