import type { Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { Address, Authorization, Hex } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type {
    GetSmartAccountParameter,
    OneOf,
    Paymaster
} from "../../types/utils.js"
import { encodeInstallModule } from "../../utils/encodeInstallModule.js"
import { getAction } from "../../utils/getAction.js"
import type { ModuleType } from "./supportsModule.js"

export type InstallModuleParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    authorization?: Authorization.Signed | undefined
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
              context: Hex.Hex
          }
        | {
              initData: Hex.Hex
          }
    >

export function installModule<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    parameters: InstallModuleParameters<TSmartAccount>
): Promise<Hex.Hex> {
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
        authorization,
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
            ...encodeInstallModule({
                account,
                modules: [{ address, context: context ?? initData, type }]
            }),
            ...(calls ?? [])
        ],
        paymaster: paymaster as BundlerClient.Paymaster | undefined,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        authorization,
        account
    })
}
