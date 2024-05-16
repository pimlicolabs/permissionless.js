import type { Chain, Client, Transport } from "viem"
import type { SignMessageParameters } from "viem"
import { signMessage as viem_signMessage } from "viem/actions"

export const signMessage = <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    { account, message }: SignMessageParameters<undefined>
) => {
    return viem_signMessage(client, { account, message })
}
