import type { Address, Chain, Client, Hex, Narrow, Transport } from "viem"
import {
    type PaymasterActions,
    type SmartAccount,
    type UserOperationCalls,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors"
import {
    type EncodeInstallModuleParameters,
    encodeInstallModule
} from "../../utils/encodeInstallModule"

export type InstallModulesParameters<
    TSmartAccount extends SmartAccount | undefined,
    calls extends readonly unknown[] = readonly unknown[]
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
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: InstallModulesParameters<TSmartAccount>
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
            ...(calls ?? [])
        ],
        paymaster,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account: account
    })
}
