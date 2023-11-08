import { type Chain, type Client, type GetChainIdReturnType, type Transport } from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import { getAction } from "../../utils/getAction.js"
import { chainId } from "../bundler/chainId.js"

export async function getChainId<TChain extends Chain | undefined, TAccount extends SmartAccount | undefined>(
    client: Client<Transport, TChain, TAccount>
): Promise<GetChainIdReturnType> {
    return getAction(client, chainId)([])
}
