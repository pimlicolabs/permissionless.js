import { type Chain, type Client, type GetChainIdReturnType, type Transport } from "viem"
import { type SmartAccount } from "../../accounts/types"
import { type BundlerActions } from "../../clients/decorators/bundler"
import { type BundlerRpcSchema } from "../../types/bundler"

export async function getChainId<TChain extends Chain | undefined, TAccount extends SmartAccount | undefined>(
    client: Client<Transport, TChain, TAccount, BundlerRpcSchema, BundlerActions>
): Promise<GetChainIdReturnType> {
    return client.chainId()
}
