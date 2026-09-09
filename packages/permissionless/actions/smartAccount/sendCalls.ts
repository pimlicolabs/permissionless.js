import type { Actions, Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { GetSmartAccountParameter } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"

type SendCallsParameters<
    chain extends Chain.Chain | undefined,
    account extends SmartAccount.SmartAccount | undefined,
    chainOverride extends Chain.Chain | undefined,
    calls extends readonly unknown[]
> = Omit<
    Actions.wallet.sendCalls.Options<chain, undefined, chainOverride, calls>,
    "account"
> &
    GetSmartAccountParameter<account>

export async function sendCalls<
    account extends SmartAccount.SmartAccount | undefined,
    chain extends Chain.Chain | undefined,
    accountOverride extends SmartAccount.SmartAccount | undefined = undefined,
    chainOverride extends Chain.Chain | undefined = Chain.Chain | undefined,
    calls extends readonly unknown[] = readonly unknown[]
>(
    client: BundlerClient.Client<chain, account>,
    args:
        | SendCallsParameters<chain, account, chainOverride, calls>
        | Erc4337Actions.userOperation.send.Options<
              account,
              accountOverride,
              calls
          >
): Promise<Actions.wallet.sendCalls.ReturnType> {
    const userOpHash = await getAction(
        client,
        Erc4337Actions.userOperation.send,
        "userOperation.send"
    )({ ...args } as Erc4337Actions.userOperation.send.Options<
        account,
        accountOverride,
        calls
    >)

    return { id: userOpHash }
}
