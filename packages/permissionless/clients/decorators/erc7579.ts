import type { Chain, Client } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import type { Hex } from "viem/utils"
import { accountId } from "../../actions/erc7579/accountId.js"
import {
    type InstallModuleParameters,
    installModule
} from "../../actions/erc7579/installModule.js"
import {
    type InstallModulesParameters,
    installModules
} from "../../actions/erc7579/installModules.js"
import {
    type IsModuleInstalledParameters,
    isModuleInstalled
} from "../../actions/erc7579/isModuleInstalled.js"
import {
    type SupportsExecutionModeParameters,
    supportsExecutionMode
} from "../../actions/erc7579/supportsExecutionMode.js"
import {
    type SupportsModuleParameters,
    supportsModule
} from "../../actions/erc7579/supportsModule.js"
import {
    type UninstallModuleParameters,
    uninstallModule
} from "../../actions/erc7579/uninstallModule.js"
import {
    type UninstallModulesParameters,
    uninstallModules
} from "../../actions/erc7579/uninstallModules.js"
import type { GetSmartAccountParameter } from "../../types/utils.js"

export type Erc7579Actions<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = {
    accountId: (
        args?: GetSmartAccountParameter<TSmartAccount>
    ) => Promise<string>
    installModule: (
        args: InstallModuleParameters<TSmartAccount>
    ) => Promise<Hex.Hex>
    installModules: (
        args: InstallModulesParameters<TSmartAccount>
    ) => Promise<Hex.Hex>
    isModuleInstalled: (
        args: IsModuleInstalledParameters<TSmartAccount>
    ) => Promise<boolean>
    supportsExecutionMode: (
        args: SupportsExecutionModeParameters<TSmartAccount>
    ) => Promise<boolean>
    supportsModule: (
        args: SupportsModuleParameters<TSmartAccount>
    ) => Promise<boolean>
    uninstallModule: (
        args: UninstallModuleParameters<TSmartAccount>
    ) => Promise<Hex.Hex>
    uninstallModules: (
        args: UninstallModulesParameters<TSmartAccount>
    ) => Promise<Hex.Hex>
}

export function erc7579Actions() {
    return <TSmartAccount extends SmartAccount.SmartAccount | undefined>(
        client_: Pick<Client.Client, "request"> & { account: TSmartAccount }
    ): Erc7579Actions<TSmartAccount> => {
        const client = client_ as BundlerClient.Client<
            Chain.Chain | undefined,
            TSmartAccount
        >
        return {
            accountId: (args) => accountId(client, args),
            installModule: (args) => installModule(client, args),
            installModules: (args) => installModules(client, args),
            isModuleInstalled: (args) => isModuleInstalled(client, args),
            supportsExecutionMode: (args) =>
                supportsExecutionMode(client, args),
            supportsModule: (args) => supportsModule(client, args),
            uninstallModule: (args) => uninstallModule(client, args),
            uninstallModules: (args) => uninstallModules(client, args)
        }
    }
}
