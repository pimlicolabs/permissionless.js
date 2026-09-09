import type { Chain, Client } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import type { Hex } from "viem/utils"
import type { GetSmartAccountParameter } from "../../types/utils.js"
import { accountId } from "./accountId.js"
import { type InstallModuleParameters, installModule } from "./installModule.js"
import {
    type InstallModulesParameters,
    installModules
} from "./installModules.js"
import {
    type IsModuleInstalledParameters,
    isModuleInstalled
} from "./isModuleInstalled.js"
import type { CallType, ExecutionMode } from "./supportsExecutionMode.js"
import {
    type SupportsExecutionModeParameters,
    supportsExecutionMode
} from "./supportsExecutionMode.js"
import type { ModuleType } from "./supportsModule.js"
import {
    type SupportsModuleParameters,
    supportsModule
} from "./supportsModule.js"
import {
    type UninstallModuleParameters,
    uninstallModule
} from "./uninstallModule.js"
import {
    type UninstallModulesParameters,
    uninstallModules
} from "./uninstallModules.js"

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

export type {
    CallType,
    ExecutionMode,
    InstallModuleParameters,
    IsModuleInstalledParameters,
    ModuleType,
    SupportsExecutionModeParameters,
    SupportsModuleParameters,
    UninstallModuleParameters
}

export {
    accountId,
    installModule,
    installModules,
    isModuleInstalled,
    supportsExecutionMode,
    supportsModule,
    uninstallModule,
    uninstallModules
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
