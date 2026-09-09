import { Account } from "viem"
import type { EntryPoint } from "viem/erc4337"
import type { Hex } from "viem/utils"
import * as SafeSmartAccount from "../../../permissionless/accounts/safe/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient,
    getSmartAccountClient
} from "../utils.js"

export const getSafeClient = async <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    erc7579,
    privateKey,
    owners,
    onchainIdentifier,
    version
}: {
    erc7579?: boolean
    owners?: readonly Account.Account[]
    onchainIdentifier?: Hex.Hex
    version?: SafeSmartAccount.Version
} & AAParamType<entryPointVersion>): Promise<
    SafeSmartAccount.ReturnType<entryPointVersion>
> =>
    SafeSmartAccount.from({
        client: getPublicClient(anvilRpc),
        onchainIdentifier,
        entryPoint: entryPoint.version,
        owners: owners ?? [
            privateKey ? Account.fromPrivateKey(privateKey) : Account.random()
        ],
        version,
        saltNonce: 420n,
        safe4337ModuleAddress: erc7579
            ? "0x7579EE8307284F293B1927136486880611F20002"
            : undefined,
        erc7579LaunchpadAddress: erc7579
            ? "0x7579011aB74c46090561ea277Ba79D510c6C00ff"
            : undefined,
        ...(erc7579
            ? {
                  attesters: ["0x000000333034E9f539ce08819E12c1b8Cb29084d"],
                  attestersThreshold: 1
              }
            : {})
    })

const randomOwners = () => [
    Account.random(),
    Account.random(),
    Account.random()
]

const safe = (
    name: string,
    options: {
        version?: SafeSmartAccount.Version
        erc7579?: boolean
        onchainIdentifier?: Hex.Hex
        multipleOwners?: boolean
        isEip1271Compliant?: boolean
    } = {}
): CoreSmartAccount => {
    const { version, erc7579, onchainIdentifier, multipleOwners } = options
    const getAccount = (conf: AAParamType<EntryPoint.Version>) =>
        getSafeClient({
            ...(conf as AAParamType<"0.6" | "0.7">),
            version,
            erc7579,
            onchainIdentifier,
            owners: multipleOwners ? randomOwners() : undefined
        })
    return {
        name,
        getSmartAccountClient: async (conf) =>
            getBundlerClient({ account: await getAccount(conf), ...conf }),
        ...(erc7579
            ? {
                  getErc7579SmartAccountClient: async (
                      conf: AAParamType<EntryPoint.Version>
                  ) =>
                      getSmartAccountClient({
                          account: await getAccount(conf),
                          ...conf
                      })
              }
            : {}),
        supportsEntryPointV06: version !== "1.5.0" && !erc7579,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: options.isEip1271Compliant ?? true
    }
}

export const safeSmartAccounts: CoreSmartAccount[] = [
    safe("Safe"),
    safe("Safe 1.5.0", { version: "1.5.0" }),
    safe("Safe (with onchain identifier)", {
        onchainIdentifier: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    }),
    safe("Safe 1.5.0 (with onchain identifier)", {
        version: "1.5.0",
        onchainIdentifier: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    }),
    safe("Safe multiple owners", { multipleOwners: true }),
    safe("Safe 1.5.0 multiple owners", {
        version: "1.5.0",
        multipleOwners: true
    }),
    safe("Safe 7579", { erc7579: true }),
    safe("Safe 1.5.0 7579", {
        version: "1.5.0",
        erc7579: true,
        isEip1271Compliant: false
    }),
    safe("Safe 7579 Multiple Owners", { erc7579: true, multipleOwners: true }),
    safe("Safe 1.5.0 7579 Multiple Owners", {
        version: "1.5.0",
        erc7579: true,
        multipleOwners: true,
        isEip1271Compliant: false
    })
]
