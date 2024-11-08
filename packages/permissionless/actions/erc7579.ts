import type { Chain, Client, Hash, Transport } from "viem"
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import { accountId } from "./erc7579/accountId.js"
import {
    type InstallModuleParameters,
    installModule
} from "./erc7579/installModule.js"
import {
    type InstallModulesParameters,
    installModules
} from "./erc7579/installModules.js"
import {
    type IsModuleInstalledParameters,
    isModuleInstalled
} from "./erc7579/isModuleInstalled.js"
import {
    type SupportsExecutionModeParameters,
    supportsExecutionMode
} from "./erc7579/supportsExecutionMode.js"
import type {
    CallType,
    ExecutionMode
} from "./erc7579/supportsExecutionMode.js"
import {
    type SupportsModuleParameters,
    supportsModule
} from "./erc7579/supportsModule.js"
import type { ModuleType } from "./erc7579/supportsModule.js"
import {
    type UninstallModuleParameters,
    uninstallModule
} from "./erc7579/uninstallModule.js"
import {
    type UninstallModulesParameters,
    uninstallModules
} from "./erc7579/uninstallModules.js"

export type Erc7579Actions<TSmartAccount extends SmartAccount | undefined> = {
    accountId: (
        args?: GetSmartAccountParameter<TSmartAccount>
    ) => Promise<string>
    installModule: (
        args: InstallModuleParameters<TSmartAccount>
    ) => Promise<Hash>
    installModules: (
        args: InstallModulesParameters<TSmartAccount>
    ) => Promise<Hash>
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
    ) => Promise<Hash>
    uninstallModules: (
        args: UninstallModulesParameters<TSmartAccount>
    ) => Promise<Hash>
}

export type {
    InstallModuleParameters,
    IsModuleInstalledParameters,
    CallType,
    ExecutionMode,
    SupportsExecutionModeParameters,
    ModuleType,
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
    return <TSmartAccount extends SmartAccount | undefined>(
        client: Client<Transport, Chain | undefined, TSmartAccount>
    ): Erc7579Actions<TSmartAccount> => ({
        accountId: (args) => accountId(client, args),
        installModule: (args) => installModule(client, args),
        installModules: (args) => installModules(client, args),
        isModuleInstalled: (args) => isModuleInstalled(client, args),
        supportsExecutionMode: (args) => supportsExecutionMode(client, args),
        supportsModule: (args) => supportsModule(client, args),
        uninstallModule: (args) => uninstallModule(client, args),
        uninstallModules: (args) => uninstallModules(client, args)
    })
}
