import type { Chain, Client, Transport } from "viem"
import type { PublicClient } from "viem"
import type { BundlerActions, SmartAccount } from "viem/account-abstraction"
import { prepareUserOperationErc20 } from "../../actions/prepareUserOperationErc20"

export type PrepareUserOperationErc20Action<
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
> = Pick<BundlerActions<TSmartAccount>, "prepareUserOperation">

export function prepareUserOperationErc20Action(publicClient: PublicClient) {
    return <
        TChain extends Chain | undefined = Chain | undefined,
        TSmartAccount extends SmartAccount | undefined =
            | SmartAccount
            | undefined
    >(
        client: Client<Transport, TChain, TSmartAccount>
    ): PrepareUserOperationErc20Action<TSmartAccount> => ({
        prepareUserOperation: (parameters) =>
            prepareUserOperationErc20(client, publicClient, parameters)
    })
}
