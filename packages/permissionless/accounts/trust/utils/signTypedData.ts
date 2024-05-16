import type { Chain, Client, Transport, TypedData } from "viem"
import type { SignTypedDataParameters } from "viem"
import { signTypedData as viem_signTypedData } from "viem/actions"

export const signTypedData = <
    const TTypedData extends TypedData | Record<string, unknown>,
    TPrimaryType extends keyof TTypedData | "EIP712Domain",
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    parameters: SignTypedDataParameters<TTypedData, TPrimaryType, undefined>
) => {
    return viem_signTypedData<TTypedData, TPrimaryType, TChain, undefined>(
        client,
        parameters
    )
}
