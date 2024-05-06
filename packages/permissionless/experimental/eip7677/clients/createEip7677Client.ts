import {
    type Chain,
    type Client,
    type PublicClientConfig,
    type Transport,
    createClient
} from "viem"
import type { EntryPoint } from "../../../types/entrypoint"
import type { Eip7677RpcSchema } from "../types/paymaster"
import { type Eip7677Actions, eip7677Actions } from "./decorators/eip7677"

export type Eip7677Client<
    TEntryPoint extends EntryPoint,
    TChain extends Chain | undefined = Chain | undefined
> = Client<
    Transport,
    TChain,
    undefined,
    Eip7677RpcSchema<TEntryPoint>,
    Eip7677Actions<TEntryPoint, TChain>
>

export const createEip7677Client = <
    TEntryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    parameters: PublicClientConfig<TTransport, TChain> & {
        entryPoint: TEntryPoint
    }
): Eip7677Client<TEntryPoint, TChain> => {
    const { key = "public", name = "EIP 7677 paymaster client" } = parameters
    const client = createClient({
        ...parameters,
        key,
        name,
        type: "bundlerClient"
    })
    return client.extend(eip7677Actions({ entryPoint: parameters.entryPoint }))
}
