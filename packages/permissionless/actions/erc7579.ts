import type { Chain, Client, Hash, Transport } from "viem"
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import { accountId } from "./erc7579/accountId"
import {
    type InstallModuleParameters,
    installModule
} from "./erc7579/installModule"
import {
    type InstallModulesParameters,
    installModules
} from "./erc7579/installModules"
import {
    type IsModuleInstalledParameters,
    isModuleInstalled
} from "./erc7579/isModuleInstalled"
import {
    type SupportsExecutionModeParameters,
    supportsExecutionMode
} from "./erc7579/supportsExecutionMode"
import type {
    CallType,
    ExecutionMode
} from "./erc7579/supportsExecutionMode"
import {
    type SupportsModuleParameters,
    supportsModule
} from "./erc7579/supportsModule"
import type { ModuleType } from "./erc7579/supportsModule"
import {
    type UninstallModuleParameters,
    uninstallModule
} from "./erc7579/uninstallModule"
import {
    type UninstallModulesParameters,
    uninstallModules
} from "./erc7579/uninstallModules"

export type Erc7579Actions<TSmartAccount extends SmartAccount | undefined> = {
    accountId: (
        args?: GetSmartAccountParameter<TSmartAccount>
    ) => Promise<string>
    installModule: <callsType extends readonly unknown[]>(
        args: InstallModuleParameters<TSmartAccount, callsType>
    ) => Promise<Hash>
    installModules: <callsType extends readonly unknown[]>(
        args: InstallModulesParameters<TSmartAccount, callsType>
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
    uninstallModule: <callsType extends readonly unknown[]>(
        args: UninstallModuleParameters<TSmartAccount, callsType>
    ) => Promise<Hash>
    uninstallModules: <callsType extends readonly unknown[]>(
        args: UninstallModulesParameters<TSmartAccount, callsType>
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
