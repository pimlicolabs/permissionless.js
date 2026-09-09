import { Account } from "viem"
import { Secp256k1 } from "viem/utils"
import { ThirdwebSmartAccount } from "../../../permissionless/accounts/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient
} from "../utils.js"

export const getThirdwebClient = <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>) =>
    ThirdwebSmartAccount.from({
        client: getPublicClient(anvilRpc),
        entryPoint: entryPoint.version,
        owner: Account.fromPrivateKey(
            privateKey ?? Secp256k1.randomPrivateKey()
        )
    })

export const thirdwebSmartAccounts: CoreSmartAccount[] = [
    {
        name: "Thirdweb",
        getSmartAccountClient: async (conf) =>
            getBundlerClient({
                account: await getThirdwebClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    }
]
