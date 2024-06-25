import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { EntryPoint } from "../../types/entrypoint"
import { accountId } from "../../actions/erc7579/accountId"
import { installModule } from "../../actions/erc7579/installModule"
import { isModuleInstalled } from "../../actions/erc7579/isModuleInstalled"
import { supportsExecutionMode } from "../../actions/erc7579/supportsExecutionMode"
import { supportsModule } from "../../actions/erc7579/supportsModule"
import { uninstallModule } from "../../actions/erc7579/uninstallModule"

export type Erc7579Actions<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined
> = {
    /**
     * Get's the accountId of the smart account
     *
     * @param args - {@link SendTransactionParameters}
     * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash. {@link SendTransactionReturnType}
     *
     * @example
     * import { createSmartAccountClient, custom } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createSmartAccountClient({
     *   chain: mainnet,
     *   transport: custom(window.ethereum),
     * })
     * const hash = await client.sendTransaction({
     *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
     *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
     *   value: 1000000000000000000n,
     * })
     *
     * @example
     * // Account Hoisting
     * import { createSmartAccountClient, http } from 'viem'
     * import { privateKeyToAccount } from 'viem/accounts'
     * import { mainnet } from 'viem/chains'
     *
     * const client = createSmartAccountClient({
     *   account: privateKeyToAccount('0x…'),
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const hash = await client.sendTransaction({
     *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
     *   value: 1000000000000000000n,
     * })
     */
    accountId: (
        args?: TSmartAccount extends undefined
            ? Parameters<typeof accountId>[1]
            : undefined
    ) => Promise<string>
    installModule: (args: Parameters<typeof installModule>[1]) => Promise<Hash>
    isModuleInstalled: (
        args: Parameters<typeof isModuleInstalled>[1]
    ) => Promise<boolean>
    supportsExecutionMode: (
        args: Parameters<typeof supportsExecutionMode>[1]
    ) => Promise<boolean>
    supportsModule: (
        args: Parameters<typeof supportsModule>[1]
    ) => Promise<boolean>
    uninstallModule: (
        args: Parameters<typeof uninstallModule>[1]
    ) => Promise<Hash>
}

export function erc7579Actions<TEntryPoint extends EntryPoint>(_args: {
    entryPoint: TEntryPoint
}) {
    return <
        TTransport extends Transport,
        TChain extends Chain | undefined,
        TSmartAccount extends SmartAccount<TEntryPoint> | undefined
    >(
        client: Client<TTransport, TChain, TSmartAccount>
    ): Erc7579Actions<TEntryPoint, TSmartAccount> => ({
        accountId: (args) => accountId(client as any, args),
        installModule: (args) => installModule(client as any, args),
        isModuleInstalled: (args) => isModuleInstalled(client as any, args),
        supportsExecutionMode: (args) =>
            supportsExecutionMode(client as any, args),
        supportsModule: (args) => supportsModule(client as any, args),
        uninstallModule: (args) => uninstallModule(client as any, args)
    })
}
