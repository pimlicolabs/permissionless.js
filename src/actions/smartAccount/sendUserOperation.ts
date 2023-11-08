import type { Chain, Client, Hex, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { BundlerActions } from "../../clients/decorators/bundler"
import type { GetAccountParameter, PartialBy, UserOperation } from "../../types"
import type { BundlerRpcSchema } from "../../types/bundler"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils"
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
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema, BundlerActions>,
    args: SendUserOperationParameters<TAccount>
): Promise<SendUserOperationReturnType> {
    const { account: account_ = client.account } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount

    const userOperation = await prepareUserOperationRequest(client, args)

    userOperation.signature = await account.signUserOperation(userOperation)

    const userOpHash = await client.sendUserOperation({
        userOperation: userOperation,
        entryPoint: account.entryPoint
    })

    return userOpHash
}
