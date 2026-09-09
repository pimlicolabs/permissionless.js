import type { Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { Address, Authorization, Hex } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { Paymaster } from "../../types/utils.js"
import {
    type EncodeInstallModuleParameters,
    encodeInstallModule
} from "../../utils/encodeInstallModule.js"
import { getAction } from "../../utils/getAction.js"

export type InstallModulesParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = EncodeInstallModuleParameters<TSmartAccount> & {
    authorization?: Authorization.Signed | undefined
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

export async function installModules<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    parameters: InstallModulesParameters<TSmartAccount>
): Promise<Hex.Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        modules,
        paymaster,
        paymasterContext,
        authorization,
        calls
    } = parameters

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
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
                modules
            }),
            ...(calls ?? [])
        ],
        paymaster: paymaster as BundlerClient.Paymaster | undefined,
        paymasterContext,
        maxFeePerGas,
        maxPriorityFeePerGas,
        authorization,
        nonce,
        account: account
    })
}
