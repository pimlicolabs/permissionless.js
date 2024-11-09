import {
    type Abi,
    type Chain,
    type Client,
    type ContractFunctionArgs,
    type ContractFunctionName,
    type EncodeFunctionDataParameters,
    type Hash,
    type SendTransactionParameters,
    type Transport,
    type WriteContractParameters,
    encodeFunctionData
} from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { sendTransaction } from "./sendTransaction.js"

export async function writeContract<
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<
        TAbi,
        "nonpayable" | "payable"
    > = ContractFunctionName<TAbi, "nonpayable" | "payable">,
    TArgs extends ContractFunctionArgs<
        TAbi,
        "nonpayable" | "payable",
        TFunctionName
    > = ContractFunctionArgs<TAbi, "nonpayable" | "payable", TFunctionName>,
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
    }: WriteContractParameters<
        TAbi,
        TFunctionName,
        TArgs,
        TChain,
        TAccount,
        TChainOverride
    >
): Promise<Hash> {
    const data = encodeFunctionData<TAbi, TFunctionName>({
        abi,
        args,
        functionName
    } as EncodeFunctionDataParameters<TAbi, TFunctionName>)

    const hash = await getAction(
        client,
        sendTransaction<TAccount, undefined, undefined>,
        "sendTransaction"
    )({
        data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
        to: address,
        ...request
    } as unknown as SendTransactionParameters<
        Chain | undefined,
        TAccount,
        undefined
    >)
    return hash
}
