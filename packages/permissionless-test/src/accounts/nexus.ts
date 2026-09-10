import { Account } from "viem"
import type { EntryPoint } from "viem/erc4337"
import { Secp256k1 } from "viem/utils"
import * as NexusSmartAccount from "../../../permissionless/accounts/nexus/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient,
    getSmartAccountClient
} from "../utils.js"

export const getNexusClient = async ({
    anvilRpc,
    privateKey
}: AAParamType<"0.7">) =>
    NexusSmartAccount.from({
        client: getPublicClient(anvilRpc),
        owner: Account.fromPrivateKey(
            privateKey ?? Secp256k1.randomPrivateKey()
        )
    })

export const nexusSmartAccounts: CoreSmartAccount[] = [
    {
        name: "Nexus",
        getSmartAccountClient: async (conf: AAParamType<EntryPoint.Version>) =>
            getBundlerClient({
                account: await getNexusClient(conf as AAParamType<"0.7">),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPoint.Version>
        ) =>
            getSmartAccountClient({
                account: await getNexusClient(conf as AAParamType<"0.7">),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    }
]
