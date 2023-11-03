import {
    type Abi,
    type Chain,
    type Client,
    type EncodeFunctionDataParameters,
    type SendTransactionParameters,
    type Transport,
    type WriteContractParameters,
    type WriteContractReturnType,
    encodeFunctionData
} from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import { type BundlerActions } from "../../clients/decorators/bundler.js"
import { type BundlerRpcSchema } from "../../types/bundler.js"
import { sendTransaction } from "./sendTransaction.js"

export async function writeContract<
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends string,
    TChainOverride extends Chain | undefined = undefined
>(
    client: Client<Transport, TChain, TAccount, BundlerRpcSchema, BundlerActions>,
    {
        abi,
        address,
        args,
        dataSuffix,
        functionName,
        ...request
    }: WriteContractParameters<TAbi, TFunctionName, TChain, TAccount, TChainOverride>
): Promise<WriteContractReturnType> {
    const data = encodeFunctionData({
        abi,
        args,
        functionName
    } as unknown as EncodeFunctionDataParameters<TAbi, TFunctionName>)
    const hash = await sendTransaction<TChain, TAccount, TChainOverride>(client, {
        data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
        to: address,
        ...request
    } as unknown as SendTransactionParameters<TChain, TAccount, TChainOverride>)
    return hash
}
