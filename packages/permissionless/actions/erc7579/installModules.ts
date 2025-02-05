import type { Address, Chain, Client, Hex, Transport } from "viem"
import {
    type PaymasterActions,
    type SmartAccount,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import {
    type EncodeInstallModuleParameters,
    encodeInstallModule
} from "../../utils/encodeInstallModule.js"

export type InstallModulesParameters<
    TSmartAccount extends SmartAccount | undefined
> = EncodeInstallModuleParameters<TSmartAccount> & {
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
    calls?: readonly {
        to: Address
        value?: bigint | undefined
        data?: Hex | undefined
    }[]
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
