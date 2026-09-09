import { Account } from "viem"
import type { EntryPoint } from "viem/erc4337"
import { Secp256k1 } from "viem/utils"
import * as TrustSmartAccount from "../../../permissionless/accounts/trust/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient
} from "../utils.js"

export const getTrustClient = async ({
    anvilRpc,
    privateKey
}: AAParamType<"0.6">) =>
    TrustSmartAccount.from({
        client: getPublicClient(anvilRpc),
        owner: Account.fromPrivateKey(
            privateKey ?? Secp256k1.randomPrivateKey()
        )
    })

export const trustSmartAccounts: CoreSmartAccount[] = [
    {
        name: "Trust",
        getSmartAccountClient: async (conf: AAParamType<EntryPoint.Version>) =>
            getBundlerClient({
                account: await getTrustClient(conf as AAParamType<"0.6">),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    }
]
