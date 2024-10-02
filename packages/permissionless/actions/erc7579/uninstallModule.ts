import type { Address, Chain, Client, Hex, OneOf, Transport } from "viem"
import {
    type GetSmartAccountParameter,
    type SmartAccount,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors"
import { encodeUninstallModule } from "../../utils/encodeUninstallModule"
import type { ModuleType } from "./supportsModule"

export type UninstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
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
        type
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
        calls: encodeUninstallModule({
            account,
            modules: [{ type, address, context: context ?? deInitData }]
        }),
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account: account
    })
}
