import type { Actions, Chain, Client } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import type { Abi, Hex, TypedData } from "viem/utils"
import { getCallsStatus } from "../../actions/smartAccount/getCallsStatus.js"
import { sendCalls } from "../../actions/smartAccount/sendCalls.js"
import { sendTransaction } from "../../actions/smartAccount/sendTransaction.js"
import { signMessage } from "../../actions/smartAccount/signMessage.js"
import { signTypedData } from "../../actions/smartAccount/signTypedData.js"
import {
    type WriteContractParameters,
    writeContract
} from "../../actions/smartAccount/writeContract.js"
import type {
    ContractFunctionArgs,
    ContractFunctionName
} from "../../types/utils.js"

export type SmartAccountActions<
    TChain extends Chain.Chain | undefined = Chain.Chain | undefined,
    TSmartAccount extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined
> = {
    /**
     * Creates, signs, and sends a new transaction to the network.
     * This function also allows you to sponsor this transaction if sender is a smartAccount
     *
     * - Docs: https://viem.sh/docs/actions/wallet/sendTransaction.html
     * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/transactions/sending-transactions
     * - JSON-RPC Methods:
     *   - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
     *   - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)
     *
     * @param args - {@link SendTransactionParameters}
     * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash. {@link SendTransactionReturnType}
     *
     * @example
     * import { http } from "viem"
     * import { sepolia } from "viem/chains"
     * import { SmartAccountClient } from "permissionless"
     *
     * const smartAccountClient = SmartAccountClient.create({
     *     account,
     *     chain: sepolia,
     *     bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE")
     * })
     * const hash = await smartAccountClient.sendTransaction({
     *     to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
     *     value: 1000000000000000000n
     * })
     */
    sendTransaction: <
        TChainOverride extends Chain.Chain | undefined = undefined,
        accountOverride extends
            | SmartAccount.SmartAccount
            | undefined = undefined,
        calls extends readonly unknown[] = readonly unknown[]
    >(
        args: Parameters<
            typeof sendTransaction<
                TSmartAccount,
                TChain,
                accountOverride,
                TChainOverride,
                calls
            >
        >[1]
    ) => Promise<Hex.Hex>
    /**
     * Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
     *
     * - Docs: https://viem.sh/docs/actions/wallet/signMessage.html
     * - JSON-RPC Methods:
     *   - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data.html#personal-sign)
     *   - Local Accounts: Signs locally. No JSON-RPC request.
     *
     * With the calculated signature, you can:
     * - use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage.html) to verify the signature,
     * - use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress.html) to recover the signing address from a signature.
     *
     * @param args - {@link SignMessageParameters}
     * @returns The signed message. {@link SignMessageReturnType}
     *
     * @example
     * const signature = await smartAccountClient.signMessage({ message: "hello world" })
     */
    signMessage: (
        args: Parameters<typeof signMessage<TSmartAccount>>[1]
    ) => ReturnType<typeof signMessage<TSmartAccount>>
    /**
     * Signs typed data and calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
     *
     * - Docs: https://viem.sh/docs/actions/wallet/signTypedData.html
     * - JSON-RPC Methods:
     *   - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4)
     *   - Local Accounts: Signs locally. No JSON-RPC request.
     *
     * @param client - Client to use
     * @param args - {@link SignTypedDataParameters}
     * @returns The signed data. {@link SignTypedDataReturnType}
     *
     * @example
     * const signature = await smartAccountClient.signTypedData({
     *     domain: {
     *         name: "Ether Mail",
     *         version: "1",
     *         chainId: 1,
     *         verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
     *     },
     *     types: {
     *         Person: [
     *             { name: "name", type: "string" },
     *             { name: "wallet", type: "address" }
     *         ],
     *         Mail: [
     *             { name: "from", type: "Person" },
     *             { name: "to", type: "Person" },
     *             { name: "contents", type: "string" }
     *         ]
     *     },
     *     primaryType: "Mail",
     *     message: {
     *         from: { name: "Cow", wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826" },
     *         to: { name: "Bob", wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB" },
     *         contents: "Hello, Bob!"
     *     }
     * })
     */
    signTypedData: <
        const TTypedData extends TypedData.TypedData | Record<string, unknown>,
        TPrimaryType extends keyof TTypedData | "EIP712Domain"
    >(
        args: Parameters<
            typeof signTypedData<TTypedData, TPrimaryType, TSmartAccount>
        >[1]
    ) => ReturnType<
        typeof signTypedData<TTypedData, TPrimaryType, TSmartAccount>
    >
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
     * @param args - {@link WriteContractParameters}
     * @returns A [Transaction Hash](https://viem.sh/docs/glossary/terms.html#hash). {@link WriteContractReturnType}
     *
     * @example
     * import { Abi } from "viem/utils"
     *
     * const hash = await smartAccountClient.writeContract({
     *     address: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
     *     abi: Abi.from(["function mint(uint32 tokenId) nonpayable"]),
     *     functionName: "mint",
     *     args: [69420]
     * })
     */
    writeContract: <
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
        args: WriteContractParameters<
            TAbi,
            TFunctionName,
            TArgs,
            TChain,
            TSmartAccount,
            TChainOverride
        >
    ) => ReturnType<
        typeof writeContract<
            TChain,
            TSmartAccount,
            TAbi,
            TFunctionName,
            TArgs,
            TChainOverride
        >
    >
    sendCalls: <
        TChainOverride extends Chain.Chain | undefined = undefined,
        accountOverride extends
            | SmartAccount.SmartAccount
            | undefined = undefined,
        calls extends readonly unknown[] = readonly unknown[]
    >(
        args: Parameters<
            typeof sendCalls<
                TSmartAccount,
                TChain,
                accountOverride,
                TChainOverride,
                calls
            >
        >[1]
    ) => Promise<Actions.wallet.sendCalls.ReturnType>
    getCallsStatus: (
        args: Parameters<typeof getCallsStatus<TSmartAccount, TChain>>[1]
    ) => Promise<Actions.wallet.getCallsStatus.ReturnType>
}

export function smartAccountActions<
    TChain extends Chain.Chain | undefined = Chain.Chain | undefined,
    TSmartAccount extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined
>(
    client_: Pick<Client.Client, "request"> & {
        account: TSmartAccount
        chain: TChain
    }
): SmartAccountActions<TChain, TSmartAccount> {
    const client = client_ as BundlerClient.Client<TChain, TSmartAccount>
    return {
        // biome-ignore lint/suspicious/noExplicitAny: calls generic widens to readonly unknown[] at the action
        sendTransaction: (args) => sendTransaction(client, args as any),
        signMessage: (args) => signMessage(client, args),
        signTypedData: (args) => signTypedData(client, args),
        writeContract: (args) => writeContract(client, args),
        // biome-ignore lint/suspicious/noExplicitAny: calls generic widens to readonly unknown[] at the action
        sendCalls: (args) => sendCalls(client, args as any),
        getCallsStatus: (args) => getCallsStatus(client, args)
    }
}
