import {
    type Abi,
    type Chain,
    type Client,
    type EncodeFunctionDataParameters,
    type Transport,
    type WriteContractParameters,
    type WriteContractReturnType,
    encodeFunctionData
} from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import { getAction } from "../../utils/getAction.js"
import { type SponsorUserOperationMiddleware } from "./prepareUserOperationRequest.js"
import {
    type SendTransactionWithPaymasterParameters,
    sendTransaction
} from "./sendTransaction.js"

export type WriteContractWithPaymasterParameters<
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined,
    TAbi extends Abi | readonly unknown[] = Abi | readonly unknown[],
    TFunctionName extends string = string,
    TChainOverride extends Chain | undefined = undefined
> = WriteContractParameters<
    TAbi,
    TFunctionName,
    TChain,
    TAccount,
    TChainOverride
> &
    SponsorUserOperationMiddleware

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
    }: WriteContractWithPaymasterParameters<
        TChain,
        TAccount,
        TAbi,
        TFunctionName,
        TChainOverride
    >
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
    } as SendTransactionWithPaymasterParameters<
        TChain,
        TAccount,
        TChainOverride
    >)
    return hash
}
