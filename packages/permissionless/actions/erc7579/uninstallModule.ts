import type { Address, Chain, Client, Hex, OneOf, Transport } from "viem"
import {
    type GetSmartAccountParameter,
    type PaymasterActions,
    type SmartAccount,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import { encodeUninstallModule } from "../../utils/encodeUninstallModule.js"
import type { ModuleType } from "./supportsModule.js"

export type UninstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address
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
} & OneOf<
        | {
              deInitData: Hex
          }
        | {
              context: Hex
          }
    >

export async function uninstallModule<
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: UninstallModuleParameters<TSmartAccount>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        address,
        context,
        deInitData,
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
            ...encodeUninstallModule({
                account,
                modules: [{ type, address, context: context ?? deInitData }]
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
