import type { Chain, Client, Transport } from "viem"
import {
    type BundlerActions,
    type SmartAccount,
    prepareUserOperation
} from "viem/account-abstraction"

export type PrepareUserOperationErc20Action<
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
> = Pick<BundlerActions<TSmartAccount>, "prepareUserOperation">

export function prepareUserOperationErc20Action() {
    return <
        TChain extends Chain | undefined = Chain | undefined,
        TSmartAccount extends SmartAccount | undefined =
            | SmartAccount
            | undefined
    >(
        client: Client<Transport, TChain, TSmartAccount>
    ): PrepareUserOperationErc20Action<TSmartAccount> => ({
        prepareUserOperation: (parameters) =>
            prepareUserOperation(client, parameters)
    })
}
