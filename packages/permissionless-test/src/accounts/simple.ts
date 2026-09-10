import { Account } from "viem"
import type { EntryPoint } from "viem/erc4337"
import { Secp256k1 } from "viem/utils"
import * as SimpleSmartAccount from "../../../permissionless/accounts/simple/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient
} from "../utils.js"

export const getSimpleClient = <entryPointVersion extends EntryPoint.Version>({
    entryPoint,
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>) =>
    SimpleSmartAccount.from({
        client: getPublicClient(anvilRpc),
        entryPoint: entryPoint.version,
        owner: Account.fromPrivateKey(
            privateKey ?? Secp256k1.randomPrivateKey()
        )
    })

export const get7702SimpleClient = ({
    anvilRpc,
    privateKey
}: AAParamType<"0.8">) =>
    SimpleSmartAccount.from({
        client: getPublicClient(anvilRpc),
        entryPoint: "0.8",
        eip7702: true,
        owner: Account.fromPrivateKey(
            privateKey ?? Secp256k1.randomPrivateKey()
        )
    })

export const simpleSmartAccounts: CoreSmartAccount[] = [
    {
        name: "Simple",
        getSmartAccountClient: async (conf) =>
            getBundlerClient({
                account: await getSimpleClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: true,
        isEip1271Compliant: false
    },
    {
        name: "Simple + EIP-7702",
        getSmartAccountClient: async (conf) =>
            getBundlerClient({
                account: await get7702SimpleClient(conf as AAParamType<"0.8">),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: false,
        supportsEntryPointV08: true,
        isEip7702Compliant: true,
        isEip1271Compliant: false
    }
]
