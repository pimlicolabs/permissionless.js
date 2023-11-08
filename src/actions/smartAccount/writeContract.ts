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
import { sendTransaction } from "./sendTransaction.js"
import { getAction } from "../../utils/getAction.js"

export async function writeContract<
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends string,
    TChainOverride extends Chain | undefined = undefined
>(
    client: Client<Transport, TChain, TAccount>,
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
    const hash = await getAction(
        client,
        sendTransaction<TChain, TAccount, TChainOverride>
    )({
        data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
        to: address,
        ...request
    } as unknown as SendTransactionParameters<TChain, TAccount, TChainOverride>)
    return hash
}
