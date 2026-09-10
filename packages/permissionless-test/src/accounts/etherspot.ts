import { Account } from "viem"
import { Secp256k1 } from "viem/utils"
import * as EtherspotSmartAccount from "../../../permissionless/accounts/etherspot/index.js"
import type { AAParamType } from "../types.js"
import {
    type CoreSmartAccount,
    getBundlerClient,
    getPublicClient
} from "../utils.js"

export const validatorAddress = "0x0740Ed7c11b9da33d9C80Bd76b826e4E90CC1906"

export const getEtherspotClient = ({
    anvilRpc,
    privateKey = Secp256k1.randomPrivateKey()
}: AAParamType<"0.7">) =>
    EtherspotSmartAccount.from({
        client: getPublicClient(anvilRpc),
        owner: Account.fromPrivateKey(privateKey)
    })

export const etherspotSmartAccounts: CoreSmartAccount[] = [
    {
        name: "Etherspot",
        getSmartAccountClient: async (conf) =>
            getBundlerClient({
                account: await getEtherspotClient(conf as AAParamType<"0.7">),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    }
]
