import type { Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { Address, Hex } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type {
    GetSmartAccountParameter,
    OneOf,
    Paymaster
} from "../../types/utils.js"
import { encodeUninstallModule } from "../../utils/encodeUninstallModule.js"
import { getAction } from "../../utils/getAction.js"
import type { ModuleType } from "./supportsModule.js"

export type UninstallModuleParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address.Address
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
    calls?: readonly {
        to: Address.Address
        value?: bigint | undefined
        data?: Hex.Hex | undefined
    }[]
    /** Paymaster address, Bundler support, or Paymaster hooks. */
    paymaster?: Address.Address | Paymaster | undefined
    /** Paymaster context to pass to `getData` and `getStubData` calls. */
    paymasterContext?: unknown | undefined
} & OneOf<
        | {
              deInitData: Hex.Hex
          }
        | {
              context: Hex.Hex
          }
    >

export async function uninstallModule<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    parameters: UninstallModuleParameters<TSmartAccount>
): Promise<Hex.Hex> {
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
        throw new AccountNotFoundError()
    }

    const account = account_ as SmartAccount.SmartAccount

    return getAction(
        client,
        Erc4337Actions.userOperation.send,
        "userOperation.send"
    )({
        calls: [
            ...encodeUninstallModule({
                account,
                modules: [{ type, address, context: context ?? deInitData }]
            }),
            ...(calls ?? [])
        ],
        paymaster: paymaster as BundlerClient.Paymaster | undefined,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account: account
    })
}
