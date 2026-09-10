import type { Actions, Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { Hex } from "viem/utils"
import { AccountNotFoundError } from "../../errors/account.js"
import { TransactionToRequiredError } from "../../errors/smartAccount.js"
import type { GetSmartAccountParameter } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"

export type SendTransactionParameters<
    chain extends Chain.Chain | undefined = Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined,
    chainOverride extends Chain.Chain | undefined = Chain.Chain | undefined
> = Omit<
    Actions.transaction.send.Options<
        chainOverride extends Chain.Chain ? chainOverride : chain
    >,
    "account"
> &
    GetSmartAccountParameter<account>

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
 * @param client - Client to use
 * @param parameters - {@link SendTransactionParameters}
 * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash.
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { sendTransaction } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const hash = await sendTransaction(client, {
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
 * import { sendTransaction } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   account: privateKeyToAccount('0x…'),
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const hash = await sendTransaction(client, {
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 */
export async function sendTransaction<
    account extends SmartAccount.SmartAccount | undefined,
    chain extends Chain.Chain | undefined,
    accountOverride extends SmartAccount.SmartAccount | undefined = undefined,
    chainOverride extends Chain.Chain | undefined = Chain.Chain | undefined,
    calls extends readonly unknown[] = readonly unknown[]
>(
    client: BundlerClient.Client<chain, account>,
    args:
        | SendTransactionParameters<chain, account, chainOverride>
        | Erc4337Actions.userOperation.send.Options<
              account,
              accountOverride,
              calls
          >
): Promise<Hex.Hex> {
    let userOpHash: Hex.Hex

    if ("to" in args) {
        const {
            account: account_ = client.account,
            data,
            maxFeePerGas,
            maxPriorityFeePerGas,
            to,
            value,
            nonce
        } = args

        if (!account_) {
            throw new AccountNotFoundError()
        }

        const account = account_ as SmartAccount.SmartAccount

        if (!to) throw new TransactionToRequiredError()

        userOpHash = await getAction(
            client,
            Erc4337Actions.userOperation.send,
            "userOperation.send"
        )({
            ...args,
            calls: [
                {
                    to,
                    value: value || BigInt(0),
                    data: data || "0x"
                }
            ],
            account,
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce: nonce ? BigInt(nonce) : undefined
        } as unknown as Erc4337Actions.userOperation.send.Options<
            account,
            accountOverride,
            calls
        >)
    } else {
        userOpHash = await getAction(
            client,
            Erc4337Actions.userOperation.send,
            "userOperation.send"
        )({ ...args } as Erc4337Actions.userOperation.send.Options<
            account,
            accountOverride,
            calls
        >)
    }

    const userOperationReceipt = await getAction(
        client,
        Erc4337Actions.userOperation.waitForReceipt,
        "userOperation.waitForReceipt"
    )({
        hash: userOpHash
    })

    return userOperationReceipt?.receipt.transactionHash
}
