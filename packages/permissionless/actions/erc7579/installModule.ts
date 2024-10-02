import type { Address, Client, Hex, Narrow, OneOf } from "viem"
import {
    type GetSmartAccountParameter,
    type PaymasterActions,
    type SmartAccount,
    type UserOperationCalls,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors"
import { encodeInstallModule } from "../../utils"
import type { ModuleType } from "./supportsModule"

export type InstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined,
    calls extends readonly unknown[] = readonly unknown[]
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address
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
} & OneOf<
        | {
              context: Hex
          }
        | {
              initData: Hex
          }
    >

export async function installModule<
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client,
    parameters: InstallModuleParameters<TSmartAccount>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        address,
        context,
        initData,
        type,
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
            ...encodeInstallModule({
                account,
                modules: [{ address, context: context ?? initData, type }]
            }),
            ...(calls ?? [])
        ],
        paymaster,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account
    })
}
