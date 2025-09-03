import type {
    Chain,
    Client,
    SendCallsParameters,
    SendCallsReturnType,
    Transport
} from "viem"
import {
    type SendUserOperationParameters,
    type SmartAccount,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"

export async function sendCalls<
    account extends SmartAccount | undefined,
    chain extends Chain | undefined,
    accountOverride extends SmartAccount | undefined = undefined,
    chainOverride extends Chain | undefined = Chain | undefined,
    calls extends readonly unknown[] = readonly unknown[]
>(
    client: Client<Transport, chain, account>,
    args:
        | SendCallsParameters<chain, account, chainOverride, calls>
        | SendUserOperationParameters<account, accountOverride, calls>
): Promise<SendCallsReturnType> {
    const userOpHash = await getAction(
        client,
        sendUserOperation,
        "sendUserOperation"
    )({ ...args } as SendUserOperationParameters<
        account,
        accountOverride,
        calls
    >)

    return { id: userOpHash }
}
