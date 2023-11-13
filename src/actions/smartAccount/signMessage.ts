import type {
    Chain,
    Client,
    SignMessageParameters,
    SignMessageReturnType,
    Transport
} from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import {
    AccountOrClientNotFoundError,
    parseAccount
} from "../../utils/index.js"

export async function signMessage<
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    {
        account: account_ = client.account,
        message
    }: SignMessageParameters<TAccount>
): Promise<SignMessageReturnType> {
    if (!account_)
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/signMessage"
        })

    const account = parseAccount(account_)
    if (account.type === "local") return account.signMessage({ message })

    throw new Error("Sign message is not supported by this account")
}
