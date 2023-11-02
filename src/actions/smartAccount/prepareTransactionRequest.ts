import type {
    Account,
    Chain,
    Client,
    PrepareTransactionRequestParameters,
    PrepareTransactionRequestReturnType,
    Transport
} from "viem"

export async function prepareTransactionRequest<
    TChain extends Chain | undefined,
    TAccount extends Account | undefined,
    TChainOverride extends Chain | undefined
>(
    _: Client<Transport, TChain, TAccount>,
    __: PrepareTransactionRequestParameters<TChain, TAccount, TChainOverride>
): Promise<PrepareTransactionRequestReturnType<TChain, TAccount, TChainOverride>> {
    throw new Error("Not implemented")
}
