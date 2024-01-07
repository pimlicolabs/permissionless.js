import type {
    Abi,
    Chain,
    Client,
    ContractFunctionArgs,
    ContractFunctionName,
    DeployContractParameters,
    SendTransactionParameters,
    Transport,
    TypedData,
    WriteContractParameters
} from "viem"
import type { SmartAccount } from "../../accounts/types.js"
import {
    type SendTransactionsWithPaymasterParameters,
    sendTransactions
} from "../../actions/smartAccount.js"
import {
    type DeployContractParametersWithPaymaster,
    deployContract
} from "../../actions/smartAccount/deployContract.js"
import {
    type PrepareUserOperationRequestReturnType,
    type SponsorUserOperationMiddleware,
    prepareUserOperationRequest
} from "../../actions/smartAccount/prepareUserOperationRequest.js"
import {
    type SendTransactionWithPaymasterParameters,
    sendTransaction
} from "../../actions/smartAccount/sendTransaction.js"
import {
    type SendUserOperationParameters,
    type SendUserOperationReturnType,
    sendUserOperation
} from "../../actions/smartAccount/sendUserOperation.js"
import { signMessage } from "../../actions/smartAccount/signMessage.js"
import { signTypedData } from "../../actions/smartAccount/signTypedData.js"
import {
    type WriteContractWithPaymasterParameters,
    writeContract
} from "../../actions/smartAccount/writeContract.js"

export type SmartAccountActions<
    TChain extends Chain | undefined = Chain | undefined,
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
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
     * import { createWalletClient, custom } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const hash = await client.sendTransaction({
     *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
     *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
     *   value: 1000000000000000000n,
     * })
     *
     * @example
     * // Account Hoisting
     * import { createWalletClient, http } from 'viem'
     * import { privateKeyToAccount } from 'viem/accounts'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   account: privateKeyToAccount('0x…'),
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const hash = await client.sendTransaction({
     *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
     *   value: 1000000000000000000n,
     * })
     */
    sendTransaction: <TChainOverride extends Chain | undefined>(
        args: SendTransactionParameters<TChain, TSmartAccount, TChainOverride>
    ) => ReturnType<
        typeof sendTransaction<TChain, TSmartAccount, TChainOverride>
    >
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
     * import { createWalletClient, custom } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const signature = await client.signMessage({
     *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
     *   message: 'hello world',
     * })
     *
     * @example
     * // Account Hoisting
     * import { createWalletClient, http } from 'viem'
     * import { privateKeyToAccount } from 'viem/accounts'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   account: privateKeyToAccount('0x…'),
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const signature = await client.signMessage({
     *   message: 'hello world',
     * })
     */
    signMessage: (
        args: Parameters<typeof signMessage<TChain, TSmartAccount>>[1]
    ) => ReturnType<typeof signMessage<TChain, TSmartAccount>>
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
     * import { createWalletClient, custom } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const signature = await client.signTypedData({
     *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
     *   domain: {
     *     name: 'Ether Mail',
     *     version: '1',
     *     chainId: 1,
     *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
     *   },
     *   types: {
     *     Person: [
     *       { name: 'name', type: 'string' },
     *       { name: 'wallet', type: 'address' },
     *     ],
     *     Mail: [
     *       { name: 'from', type: 'Person' },
     *       { name: 'to', type: 'Person' },
     *       { name: 'contents', type: 'string' },
     *     ],
     *   },
     *   primaryType: 'Mail',
     *   message: {
     *     from: {
     *       name: 'Cow',
     *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
     *     },
     *     to: {
     *       name: 'Bob',
     *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
     *     },
     *     contents: 'Hello, Bob!',
     *   },
     * })
     *
     * @example
     * // Account Hoisting
     * import { createWalletClient, http } from 'viem'
     * import { privateKeyToAccount } from 'viem/accounts'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   account: privateKeyToAccount('0x…'),
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const signature = await client.signTypedData({
     *   domain: {
     *     name: 'Ether Mail',
     *     version: '1',
     *     chainId: 1,
     *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
     *   },
     *   types: {
     *     Person: [
     *       { name: 'name', type: 'string' },
     *       { name: 'wallet', type: 'address' },
     *     ],
     *     Mail: [
     *       { name: 'from', type: 'Person' },
     *       { name: 'to', type: 'Person' },
     *       { name: 'contents', type: 'string' },
     *     ],
     *   },
     *   primaryType: 'Mail',
     *   message: {
     *     from: {
     *       name: 'Cow',
     *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
     *     },
     *     to: {
     *       name: 'Bob',
     *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
     *     },
     *     contents: 'Hello, Bob!',
     *   },
     * })
     */
    signTypedData: <
        const TTypedData extends TypedData | { [key: string]: unknown },
        TPrimaryType extends string
    >(
        args: Parameters<
            typeof signTypedData<
                TTypedData,
                TPrimaryType,
                TChain,
                TSmartAccount
            >
        >[1]
    ) => ReturnType<
        typeof signTypedData<TTypedData, TPrimaryType, TChain, TSmartAccount>
    >
    /**
     * Deploys a contract to the network, given bytecode and constructor arguments.
     * This function also allows you to sponsor this transaction if sender is a smartAccount
     *
     * - Docs: https://viem.sh/docs/contract/deployContract.html
     * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/contracts/deploying-contracts
     *
     * @param args - {@link DeployContractParameters}
     * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash. {@link DeployContractReturnType}
     *
     * @example
     * import { createWalletClient, http } from 'viem'
     * import { privateKeyToAccount } from 'viem/accounts'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   account: privateKeyToAccount('0x…'),
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const hash = await client.deployContract({
     *   abi: [],
     *   account: '0x…,
     *   bytecode: '0x608060405260405161083e38038061083e833981016040819052610...',
     * })
     */
    deployContract: <
        const TAbi extends Abi | readonly unknown[],
        TChainOverride extends Chain | undefined = undefined
    >(
        args: DeployContractParameters<
            TAbi,
            TChain,
            TSmartAccount,
            TChainOverride
        >
    ) => ReturnType<typeof deployContract<TChain, TSmartAccount>>
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
     * import { createWalletClient, custom, parseAbi } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const hash = await client.writeContract({
     *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
     *   abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
     *   functionName: 'mint',
     *   args: [69420],
     * })
     *
     * @example
     * // With Validation
     * import { createWalletClient, custom, parseAbi } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const { request } = await client.simulateContract({
     *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
     *   abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
     *   functionName: 'mint',
     *   args: [69420],
     * }
     * const hash = await client.writeContract(request)
     */
    writeContract: <
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
    prepareUserOperationRequest: <TTransport extends Transport>(
        args: Parameters<
            typeof prepareUserOperationRequest<
                TTransport,
                TChain,
                TSmartAccount
            >
        >[1]
    ) => Promise<PrepareUserOperationRequestReturnType>
    sendUserOperation: <TTransport extends Transport>(
        args: Parameters<
            typeof sendUserOperation<TTransport, TChain, TSmartAccount>
        >[1]
    ) => Promise<SendUserOperationReturnType>
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
     * import { createWalletClient, custom } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const hash = await client.sendTransaction([{
     *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
     *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
     *   value: 1000000000000000000n
     * }, {
     *   to: '0x61897970c51812dc3a010c7d01b50e0d17dc1234',
     *   value: 10000000000000000n
     * })
     *
     * @example
     * // Account Hoisting
     * import { createWalletClient, http } from 'viem'
     * import { privateKeyToAccount } from 'viem/accounts'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createWalletClient({
     *   account: privateKeyToAccount('0x…'),
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const hash = await client.sendTransaction([{
     *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
     *   value: 1000000000000000000n
     * }, {
     *   to: '0x61897970c51812dc3a010c7d01b50e0d17dc1234',
     *   value: 10000000000000000n
     * }])
     */
    sendTransactions: (
        args: SendTransactionsWithPaymasterParameters<TSmartAccount>
    ) => ReturnType<typeof sendTransactions<TChain, TSmartAccount>>
}

export const smartAccountActions =
    ({ sponsorUserOperation }: SponsorUserOperationMiddleware) =>
    <
        TTransport extends Transport,
        TChain extends Chain | undefined = Chain | undefined,
        TSmartAccount extends SmartAccount | undefined =
            | SmartAccount
            | undefined
    >(
        client: Client<TTransport, TChain, TSmartAccount>
    ): SmartAccountActions<TChain, TSmartAccount> => ({
        prepareUserOperationRequest: (args) =>
            prepareUserOperationRequest(client, args),
        deployContract: (args) =>
            deployContract(client, {
                ...args,
                sponsorUserOperation
            } as DeployContractParametersWithPaymaster),
        sendTransaction: (args) =>
            sendTransaction(client, {
                ...args,
                sponsorUserOperation
            } as SendTransactionWithPaymasterParameters),
        sendTransactions: (args) =>
            sendTransactions(client, {
                ...args,
                sponsorUserOperation
            } as SendTransactionsWithPaymasterParameters),
        sendUserOperation: (args) =>
            sendUserOperation(client, {
                ...args,
                sponsorUserOperation
            } as SendUserOperationParameters),
        signMessage: (args) => signMessage(client, args),
        signTypedData: (args) => signTypedData(client, args),
        writeContract: <
            const TAbi extends Abi | readonly unknown[],
            TFunctionName extends ContractFunctionName<
                TAbi,
                "nonpayable" | "payable"
            > = ContractFunctionName<TAbi, "nonpayable" | "payable">,
            TArgs extends ContractFunctionArgs<
                TAbi,
                "nonpayable" | "payable",
                TFunctionName
            > = ContractFunctionArgs<
                TAbi,
                "nonpayable" | "payable",
                TFunctionName
            >,
            TChainOverride extends Chain | undefined = undefined
        >(
            args: WriteContractParameters<
                TAbi,
                TFunctionName,
                TArgs,
                TChain,
                TSmartAccount,
                TChainOverride
            >
        ) =>
            writeContract(client, {
                ...args,
                sponsorUserOperation
            } as WriteContractWithPaymasterParameters<
                TChain,
                TSmartAccount,
                TAbi,
                TFunctionName,
                TArgs,
                TChainOverride
            >)
    })
