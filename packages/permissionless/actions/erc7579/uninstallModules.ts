import type { Address, Chain, Client, Hex, Narrow, Transport } from "viem"
import {
    type PaymasterActions,
    type SmartAccount,
    type UserOperationCalls,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import {
    type EncodeUninstallModuleParameters,
    encodeUninstallModule
} from "../../utils/encodeUninstallModule.js"

export type UninstallModulesParameters<
    TSmartAccount extends SmartAccount | undefined,
    calls extends readonly unknown[]
> = EncodeUninstallModuleParameters<TSmartAccount> & {
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
    calls?: UserOperationCalls<Narrow<calls>>
    paymaster?:
        | Address
        | true
        | {
              /** Retrieves paymaster-related User Operation properties to be used for sending the User Operation. */
              getPaymasterData?:
                  | PaymasterActions["getPaymasterData"]
                  | undefined
              /** Retrieves paymaster-related User Operation properties to be used for gas estimation. */
              getPaymasterStubData?:
                  | PaymasterActions["getPaymasterStubData"]
                  | undefined
          }
        | undefined
    /** Paymaster context to pass to `getPaymasterData` and `getPaymasterStubData` calls. */
    paymasterContext?: unknown | undefined
}

export async function uninstallModules<
    TSmartAccount extends SmartAccount | undefined,
    calls extends readonly unknown[]
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: UninstallModulesParameters<TSmartAccount, calls>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        modules,
        calls,
        paymaster,
        paymasterContext
    } = parameters

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

    return getAction(
        client,
        sendUserOperation,
        "sendUserOperation"
    )({
        calls: [
            ...encodeUninstallModule({
                account,
                modules
            }),
            ...((calls ?? []) as readonly {
                to: `0x${string}`
                value: bigint
                data: `0x${string}`
            }[])
        ],
        paymaster,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account
    })
}
