import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "../accounts"
import type { GetAccountParameter } from "../types"
import type { EntryPoint } from "../types/entrypoint"
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
import type { CallType, ExecutionMode } from "./erc7579/supportsExecutionMode"
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

export type Erc7579Actions<
    TEntryPoint extends EntryPoint,
    TTransport extends Transport,
    TChain extends Chain | undefined,
    TSmartAccount extends
        | SmartAccount<TEntryPoint, string, TTransport, TChain>
        | undefined
> = {
    accountId: (
        args?: TSmartAccount extends undefined
            ? GetAccountParameter<
                  TEntryPoint,
                  TTransport,
                  TChain,
                  TSmartAccount
              >
            : undefined
    ) => Promise<string>
    installModule: (
        args: InstallModuleParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
    ) => Promise<Hash>
    installModules: (
        args: InstallModulesParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
    ) => Promise<Hash>
    isModuleInstalled: (
        args: IsModuleInstalledParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
    ) => Promise<boolean>
    supportsExecutionMode: (
        args: SupportsExecutionModeParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
    ) => Promise<boolean>
    supportsModule: (
        args: SupportsModuleParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
    ) => Promise<boolean>
    uninstallModule: (
        args: UninstallModuleParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
    ) => Promise<Hash>
    uninstallModules: (
        args: UninstallModulesParameters<
            TEntryPoint,
            TTransport,
            TChain,
            TSmartAccount
        >
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

export function erc7579Actions<TEntryPoint extends EntryPoint>(_args: {
    entryPoint: TEntryPoint
}) {
    return <
        TTransport extends Transport,
        TChain extends Chain | undefined,
        TSmartAccount extends
            | SmartAccount<TEntryPoint, string, TTransport, TChain>
            | undefined
    >(
        client: Client<TTransport, TChain, TSmartAccount>
    ): Erc7579Actions<TEntryPoint, TTransport, TChain, TSmartAccount> => ({
        accountId: (args) => accountId(client, args),
        installModule: (args) =>
            installModule<TEntryPoint, TTransport, TChain, TSmartAccount>(
                client,
                args
            ),
        installModules: (args) =>
            installModules<TEntryPoint, TTransport, TChain, TSmartAccount>(
                client,
                args
            ),
        isModuleInstalled: (args) =>
            isModuleInstalled<TEntryPoint, TTransport, TChain, TSmartAccount>(
                client,
                args
            ),
        supportsExecutionMode: (args) =>
            supportsExecutionMode<
                TEntryPoint,
                TTransport,
                TChain,
                TSmartAccount
            >(client, args),
        supportsModule: (args) =>
            supportsModule<TEntryPoint, TTransport, TChain, TSmartAccount>(
                client,
                args
            ),
        uninstallModule: (args) =>
            uninstallModule<TEntryPoint, TTransport, TChain, TSmartAccount>(
                client,
                args
            ),
        uninstallModules: (args) =>
            uninstallModules<TEntryPoint, TTransport, TChain, TSmartAccount>(
                client,
                args
            )
    })
}
