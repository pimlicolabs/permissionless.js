import {
    type Abi,
    type Chain,
    type Client,
    type DeployContractParameters,
    type DeployContractReturnType,
    type SendTransactionParameters,
    type Transport,
    encodeDeployData
} from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { BundlerActions } from "../../clients/decorators/bundler"
import type { BundlerRpcSchema } from "../../types/bundler"
import { sendTransaction } from "./sendTransaction"

export function deployContract<
    const TAbi extends Abi | readonly unknown[],
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    TChainOverride extends Chain | undefined
>(
    walletClient: Client<Transport, TChain, TAccount, BundlerRpcSchema, BundlerActions>,
    { abi, args, bytecode, ...request }: DeployContractParameters<TAbi, TChain, TAccount, TChainOverride>
): Promise<DeployContractReturnType> {
    const calldata = encodeDeployData({
        abi,
        args,
        bytecode
    } as unknown as DeployContractParameters<TAbi, TChain, TAccount, TChainOverride>)
    return sendTransaction(walletClient, {
        ...request,
        data: calldata
    } as unknown as SendTransactionParameters<TChain, TAccount, TChainOverride>)
}
