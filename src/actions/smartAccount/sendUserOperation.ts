import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types.js"
import type {
    GetAccountParameter,
    PartialBy,
    Prettify,
    UserOperation
} from "../../types/index.js"
import { getAction } from "../../utils/getAction.js"
import {
    AccountOrClientNotFoundError,
    parseAccount
} from "../../utils/index.js"
import { sendUserOperation as sendUserOperationBundler } from "../bundler/sendUserOperation.js"
import {
    type SponsorUserOperationMiddleware,
    prepareUserOperationRequest
} from "./prepareUserOperationRequest.js"

export type SendUserOperationParameters<
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
> = {
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
} & GetAccountParameter<TAccount> &
    SponsorUserOperationMiddleware

export async function sendUserOperation<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: Prettify<SendUserOperationParameters<TAccount>>
): Promise<Hash> {
    const { account: account_ = client.account } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount

    const userOperation = await getAction(
        client,
        prepareUserOperationRequest
    )(args)

    userOperation.signature = await account.signUserOperation(userOperation)

    return sendUserOperationBundler(client, {
        userOperation: userOperation,
        entryPoint: account.entryPoint
    })
}
