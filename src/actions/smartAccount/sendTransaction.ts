import type { Chain, Client, SendTransactionParameters, SendTransactionReturnType, Transport } from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils/index.js"
import { sendUserOperation } from "./sendUserOperation.js"
import { getAction } from "../../utils/getAction.js"
import { waitForUserOperationReceipt } from "../bundler/waitForUserOperationReceipt.js"

export async function sendTransaction<
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    TChainOverride extends Chain | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    args: SendTransactionParameters<TChain, TAccount, TChainOverride>
): Promise<SendTransactionReturnType> {
    const { account: account_ = client.account, data, maxFeePerGas, maxPriorityFeePerGas, to, value } = args

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

    if (!to) throw new Error("Missing to address")

    if (account.type !== "local") {
        throw new Error("RPC account type not supported")
    }

    const callData = await account.encodeCallData({
        to,
        value: value || 0n,
        data: data || "0x"
    })

    const userOpHash = await getAction(
        client,
        sendUserOperation
    )({
        userOperation: {
            sender: account.address,
            paymasterAndData: "0x",
            maxFeePerGas: maxFeePerGas || 0n,
            maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
            callData: callData
        },
        account: account
    })

    const userOperationReceipt = await getAction(
        client,
        waitForUserOperationReceipt
    )({
        hash: userOpHash
    })

    return userOperationReceipt?.receipt.transactionHash
}
