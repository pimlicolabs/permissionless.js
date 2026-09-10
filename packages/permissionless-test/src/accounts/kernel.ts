import { Account } from "viem"
import type { EntryPoint } from "viem/erc4337"
import * as KernelSmartAccount from "../../../permissionless/accounts/kernel/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient,
    getSmartAccountClient
} from "../utils.js"

export const getKernelClient = <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    privateKey,
    version,
    useMetaFactory,
    eip7702 = false
}: AAParamType<entryPointVersion> & {
    version?: KernelSmartAccount.Version<entryPointVersion>
    useMetaFactory?: boolean
    eip7702?: boolean
}) => {
    if (
        (version === "0.3.0-beta" || version === "0.3.1") &&
        entryPoint.version === "0.6"
    )
        throw new Error("Kernel ERC7579 is not supported for V06")
    const client = getPublicClient(anvilRpc)
    const owner = privateKey
        ? Account.fromPrivateKey(privateKey)
        : Account.random()
    if (eip7702)
        return KernelSmartAccount.from({ client, owner, eip7702: true })
    return KernelSmartAccount.from({
        client,
        entryPoint: entryPoint.version,
        owner,
        version,
        useMetaFactory
    })
}

const kernel = ({
    name,
    entryPoint,
    version,
    useMetaFactory,
    eip7702
}: {
    name: string
    entryPoint: "0.6" | "0.7"
    version: KernelSmartAccount.Version
    useMetaFactory?: boolean
    eip7702?: boolean
}): CoreSmartAccount => {
    const account = (conf: AAParamType<EntryPoint.Version>) =>
        getKernelClient({
            ...(conf as AAParamType<"0.6" | "0.7">),
            version,
            useMetaFactory,
            eip7702
        })
    return {
        name,
        getSmartAccountClient: async (conf) =>
            getBundlerClient({ account: await account(conf), ...conf }),
        ...(entryPoint === "0.7" && !eip7702
            ? {
                  getErc7579SmartAccountClient: async (
                      conf: AAParamType<EntryPoint.Version>
                  ) =>
                      getSmartAccountClient({
                          account: await account(conf),
                          ...conf
                      })
              }
            : {}),
        supportsEntryPointV06: entryPoint === "0.6",
        supportsEntryPointV07: entryPoint === "0.7",
        supportsEntryPointV08: false,
        ...(eip7702 ? { isEip7702Compliant: true } : {}),
        isEip1271Compliant: true
    }
}

export const kernelSmartAccounts: CoreSmartAccount[] = [
    kernel({ name: "Kernel 0.2.1", entryPoint: "0.6", version: "0.2.1" }),
    kernel({ name: "Kernel 0.2.2", entryPoint: "0.6", version: "0.2.2" }),
    kernel({ name: "Kernel 0.2.3", entryPoint: "0.6", version: "0.2.3" }),
    kernel({ name: "Kernel 0.2.4", entryPoint: "0.6", version: "0.2.4" }),
    kernel({
        name: "Kernel 7579 0.3.0-beta (non meta factory deployment)",
        entryPoint: "0.7",
        version: "0.3.0-beta",
        useMetaFactory: false
    }),
    kernel({
        name: "Kernel 7579 0.3.0-beta",
        entryPoint: "0.7",
        version: "0.3.0-beta"
    }),
    kernel({
        name: "Kernel 7579 0.3.1 (non meta factory deployment)",
        entryPoint: "0.7",
        version: "0.3.1",
        useMetaFactory: false
    }),
    kernel({ name: "Kernel 7579 0.3.1", entryPoint: "0.7", version: "0.3.1" }),
    kernel({ name: "Kernel 7579 0.3.2", entryPoint: "0.7", version: "0.3.2" }),
    kernel({ name: "Kernel 7579 0.3.3", entryPoint: "0.7", version: "0.3.3" }),
    kernel({
        name: "Kernel 0.3.3 + EIP-7702",
        entryPoint: "0.7",
        version: "0.3.3",
        eip7702: true
    })
]
