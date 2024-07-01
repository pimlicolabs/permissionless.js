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

export type Erc7579Actions<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined
> = {
    accountId: (
        args?: TSmartAccount extends undefined
            ? GetAccountParameter<TEntryPoint, TSmartAccount>
            : undefined
    ) => Promise<string>
    installModule: (
        args: InstallModuleParameters<TEntryPoint, TSmartAccount>
    ) => Promise<Hash>
    isModuleInstalled: (
        args: IsModuleInstalledParameters<TEntryPoint, TSmartAccount>
    ) => Promise<boolean>
    supportsExecutionMode: (
        args: SupportsExecutionModeParameters<TEntryPoint, TSmartAccount>
    ) => Promise<boolean>
    supportsModule: (
        args: SupportsModuleParameters<TEntryPoint, TSmartAccount>
    ) => Promise<boolean>
    uninstallModule: (
        args: UninstallModuleParameters<TEntryPoint, TSmartAccount>
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
    isModuleInstalled,
    supportsExecutionMode,
    supportsModule,
    uninstallModule
}

export function erc7579Actions<TEntryPoint extends EntryPoint>(_args: {
    entryPoint: TEntryPoint
}) {
    return <
        TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
        TTransport extends Transport,
        TChain extends Chain | undefined
    >(
        client: Client<TTransport, TChain, TSmartAccount>
    ): Erc7579Actions<TEntryPoint, TSmartAccount> => ({
        accountId: (args) => accountId(client, args),
        installModule: (args) =>
            installModule<TEntryPoint, TSmartAccount, TTransport, TChain>(
                client,
                args
            ),
        isModuleInstalled: (args) =>
            isModuleInstalled<TEntryPoint, TSmartAccount, TTransport, TChain>(
                client,
                args
            ),
        supportsExecutionMode: (args) =>
            supportsExecutionMode<
                TEntryPoint,
                TSmartAccount,
                TTransport,
                TChain
            >(client, args),
        supportsModule: (args) =>
            supportsModule<TEntryPoint, TSmartAccount, TTransport, TChain>(
                client,
                args
            ),
        uninstallModule: (args) =>
            uninstallModule<TEntryPoint, TSmartAccount, TTransport, TChain>(
                client,
                args
            )
    })
}
