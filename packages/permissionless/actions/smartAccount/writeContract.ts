import type { Chain } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import { type Abi, AbiFunction, type Address, type Hex } from "viem/utils"
import type {
    ContractFunctionArgs,
    ContractFunctionName
} from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import {
    type SendTransactionParameters,
    sendTransaction
} from "./sendTransaction.js"

export type WriteContractParameters<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    functionName extends ContractFunctionName<
        abi,
        "nonpayable" | "payable"
    > = ContractFunctionName<abi, "nonpayable" | "payable">,
    args extends ContractFunctionArgs<
        abi,
        "nonpayable" | "payable",
        functionName
    > = ContractFunctionArgs<abi, "nonpayable" | "payable", functionName>,
    chain extends Chain.Chain | undefined = Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    chainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
> = Omit<
    SendTransactionParameters<chain, account, chainOverride>,
    "data" | "to"
> & {
    abi: abi
    address: Address.Address
    functionName: functionName
    args?: args | undefined
}

export async function writeContract<
    TChain extends Chain.Chain | undefined,
    TAccount extends SmartAccount.SmartAccount | undefined,
    const TAbi extends Abi.Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<
        TAbi,
        "nonpayable" | "payable"
    > = ContractFunctionName<TAbi, "nonpayable" | "payable">,
    TArgs extends ContractFunctionArgs<
        TAbi,
        "nonpayable" | "payable",
        TFunctionName
    > = ContractFunctionArgs<TAbi, "nonpayable" | "payable", TFunctionName>,
    TChainOverride extends Chain.Chain | undefined = undefined
>(
    client: BundlerClient.Client<TChain, TAccount>,
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
): Promise<Hex.Hex> {
    const data = AbiFunction.encodeData(
        AbiFunction.fromAbi(abi as Abi.Abi, functionName as string, {
            args: args as readonly unknown[] | undefined
        }),
        args as readonly unknown[] | undefined
    )

    const hash = await getAction(
        client,
        sendTransaction<TAccount, TChain, undefined, undefined>,
        "sendTransaction"
    )({
        data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
        to: address,
        ...request
    } as unknown as SendTransactionParameters<TChain, TAccount, undefined>)
    return hash
}
