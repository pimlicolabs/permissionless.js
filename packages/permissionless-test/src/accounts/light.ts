import { Account } from "viem"
import type { EntryPoint } from "viem/erc4337"
import * as LightSmartAccount from "../../../permissionless/accounts/light/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient
} from "../utils.js"

export const getLightAccountClient = <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>) =>
    LightSmartAccount.from({
        client: getPublicClient(anvilRpc),
        entryPoint: entryPoint.version,
        owner: privateKey
            ? Account.fromPrivateKey(privateKey)
            : Account.random()
    })

export const lightSmartAccounts: CoreSmartAccount[] = [
    {
        name: "LightAccount 1.1.0",
        getSmartAccountClient: async (conf: AAParamType<EntryPoint.Version>) =>
            getBundlerClient({
                account: await getLightAccountClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount 2.0.0",
        getSmartAccountClient: async (conf: AAParamType<EntryPoint.Version>) =>
            getBundlerClient({
                account: await getLightAccountClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    }
]
