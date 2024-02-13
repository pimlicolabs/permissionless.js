import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type {
    GetAccountParameter,
    PartialBy,
    Prettify,
    UserOperation
} from "../../types/"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    EntryPoint,
    GetEntryPointVersion
} from "../../types/entrypoint"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils/"
import { getAction } from "../../utils/getAction"
import { sendUserOperation as sendUserOperationBundler } from "../bundler/sendUserOperation"
import {
    type SponsorUserOperationMiddleware,
    prepareUserOperationRequest
} from "./prepareUserOperationRequest"

export type SendUserOperationParameters<
    entryPoint extends EntryPoint,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = {
    userOperation: entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
        ? PartialBy<
              UserOperation<"0.6">,
              | "sender"
              | "nonce"
              | "initCode"
              | "callGasLimit"
              | "verificationGasLimit"
              | "preVerificationGas"
              | "maxFeePerGas"
              | "maxPriorityFeePerGas"
              | "paymasterAndData"
              | "signature"
          >
        : PartialBy<
              UserOperation<"0.7">,
              | "sender"
              | "nonce"
              | "factory"
              | "factoryData"
              | "callGasLimit"
              | "verificationGasLimit"
              | "preVerificationGas"
              | "maxFeePerGas"
              | "maxPriorityFeePerGas"
              | "paymaster"
              | "paymasterVerificationGasLimit"
              | "paymasterPostOpGasLimit"
              | "paymasterData"
              | "signature"
          >
} & GetAccountParameter<entryPoint, TAccount> &
    SponsorUserOperationMiddleware<entryPoint>

export async function sendUserOperation<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: Prettify<SendUserOperationParameters<entryPoint, TAccount>>
): Promise<Hash> {
    const { account: account_ = client.account } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount<entryPoint>

    const userOperation = await getAction(
        client,
        prepareUserOperationRequest<entryPoint, TTransport, TChain, TAccount>
    )(args)

    userOperation.signature = await account.signUserOperation(
        userOperation as UserOperation<GetEntryPointVersion<entryPoint>>
    )

    return sendUserOperationBundler(client, {
        userOperation: userOperation as UserOperation<
            GetEntryPointVersion<entryPoint>
        >,
        entryPoint: account.entryPoint
    })
}
