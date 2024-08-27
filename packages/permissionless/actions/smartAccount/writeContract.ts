import {
    type Abi,
    type Chain,
    type Client,
    type ContractFunctionArgs,
    type ContractFunctionName,
    type EncodeFunctionDataParameters,
    type Hash,
    type Transport,
    type WriteContractParameters,
    encodeFunctionData
} from "viem"
import { getAction } from "viem/utils"
import type { SmartAccount } from "../../accounts/types"
import type { EntryPoint } from "../../types/entrypoint"
import type { Middleware } from "./prepareUserOperationRequest"
import {
    type SendTransactionWithPaymasterParameters,
    sendTransaction
} from "./sendTransaction"

/**
 * Executes a write function on a contract.
 * This function also allows you to sponsor this transaction if sender is a smartAccount
 *
 * - Docs: https://viem.sh/docs/contract/writeContract.html
 * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/contracts/writing-to-contracts
 *
 * A "write" function on a Solidity contract modifies the state of the blockchain. These types of functions require gas to be executed, and hence a [Transaction](https://viem.sh/docs/glossary/terms.html) is needed to be broadcast in order to change the state.
 *
 * Internally, uses a [Wallet Client](https://viem.sh/docs/clients/wallet.html) to call the [`sendTransaction` action](https://viem.sh/docs/actions/wallet/sendTransaction.html) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData.html).
 *
 * __Warning: The `write` internally sends a transaction – it does not validate if the contract write will succeed (the contract may throw an error). It is highly recommended to [simulate the contract write with `contract.simulate`](https://viem.sh/docs/contract/writeContract.html#usage) before you execute it.__
 *
 * @param client - Client to use
 * @param parameters - {@link WriteContractParameters}
 * @returns A [Transaction Hash](https://viem.sh/docs/glossary/terms.html#hash).
 *
 * @example
 * import { createWalletClient, custom, parseAbi } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { writeContract } from 'viem/contract'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const hash = await writeContract(client, {
 *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
 *   abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
 *   functionName: 'mint',
 *   args: [69420],
 * })
 *
 * @example
 * // With Validation
 * import { createWalletClient, http, parseAbi } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { simulateContract, writeContract } from 'viem/contract'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const { request } = await simulateContract(client, {
 *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
 *   abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
 *   functionName: 'mint',
 *   args: [69420],
 * }
 * const hash = await writeContract(client, request)
 */
export type WriteContractWithPaymasterParameters<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends
        | SmartAccount<entryPoint, string, TTransport, TChain>
        | undefined =
        | SmartAccount<entryPoint, string, TTransport, TChain>
        | undefined,
    TAbi extends Abi | readonly unknown[] = Abi | readonly unknown[],
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
> = WriteContractParameters<
    TAbi,
    TFunctionName,
    TArgs,
    TChain,
    TAccount,
    TChainOverride
> &
    Middleware<entryPoint>

export async function writeContract<
    entryPoint extends EntryPoint,
    TTransport extends Transport,
    TChain extends Chain | undefined,
    TAccount extends
        | SmartAccount<entryPoint, string, TTransport, TChain>
        | undefined,
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
    }: WriteContractWithPaymasterParameters<
        entryPoint,
        TTransport,
        TChain,
        TAccount,
        TAbi,
        TFunctionName,
        TArgs,
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
        sendTransaction<
            TTransport,
            TChain,
            TAccount,
            entryPoint,
            TChainOverride
        >,
        "sendTransaction"
    )({
        data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
        to: address,
        ...request
    } as unknown as SendTransactionWithPaymasterParameters<
        entryPoint,
        TTransport,
        TChain,
        TAccount,
        TChainOverride
    >)
    return hash
}
