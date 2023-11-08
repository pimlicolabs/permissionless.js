import type { Chain, Client, Hex, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, PartialBy, UserOperation } from "../../types"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils"
import { getAction } from "../../utils/getAction"
import { sendUserOperation as sendUserOperationBundler } from "../bundler/sendUserOperation"
import { prepareUserOperationRequest } from "./prepareUserOperationRequest"

export type SendUserOperationParameters<TAccount extends SmartAccount | undefined = SmartAccount | undefined> = {
    userOperation: PartialBy<
        UserOperation,
        | "nonce"
        | "sender"
        | "initCode"
        | "signature"
        | "callGasLimit"
        | "maxFeePerGas"
        | "maxPriorityFeePerGas"
        | "preVerificationGas"
        | "verificationGasLimit"
        | "paymasterAndData"
    >
} & GetAccountParameter<TAccount>

export type SendUserOperationReturnType = Hex

export async function sendUserOperation<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: SendUserOperationParameters<TAccount>
): Promise<SendUserOperationReturnType> {
    const { account: account_ = client.account } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount

    const userOperation = await getAction(client, prepareUserOperationRequest)(args)

    userOperation.signature = await account.signUserOperation(userOperation)

    const userOpHash = await getAction(
        client,
        sendUserOperationBundler,
        "sendUserOperation"
    )({
        userOperation: userOperation,
        entryPoint: account.entryPoint
    })

    return userOpHash
}
