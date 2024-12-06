import type { Address, Chain, Client, Hex, Narrow, Transport } from "viem"
import {
    type PaymasterActions,
    type SmartAccount,
    type UserOperationCalls,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import {
    type EncodeInstallModuleParameters,
    encodeInstallModule
} from "../../utils/encodeInstallModule.js"

export type InstallModulesParameters<
    TSmartAccount extends SmartAccount | undefined,
    calls extends readonly unknown[]
> = EncodeInstallModuleParameters<TSmartAccount> & {
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

export async function installModules<
    TSmartAccount extends SmartAccount | undefined,
    calls extends readonly unknown[]
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: InstallModulesParameters<TSmartAccount, calls>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        modules,
        paymaster,
        paymasterContext,
        calls
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
            ...encodeInstallModule({
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
        account: account
    })
}
