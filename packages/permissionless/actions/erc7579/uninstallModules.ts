import type { Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { Address, Hex } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { Paymaster } from "../../types/utils.js"
import {
    type EncodeUninstallModuleParameters,
    encodeUninstallModule
} from "../../utils/encodeUninstallModule.js"
import { getAction } from "../../utils/getAction.js"

export type UninstallModulesParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = EncodeUninstallModuleParameters<TSmartAccount> & {
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
}

export async function uninstallModules<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    parameters: UninstallModulesParameters<TSmartAccount>
): Promise<Hex.Hex> {
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
                modules
            }),
            ...(calls ?? [])
        ],
        paymaster: paymaster as BundlerClient.Paymaster | undefined,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account
    })
}
