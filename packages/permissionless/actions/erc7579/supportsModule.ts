import type { Chain, Client, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"

export type moduleType = "validation" | "execution" | "fallback" | "hooks"

export type SupportsModuleParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined
> = GetAccountParameter<TEntryPoint, TSmartAccount> & {
    type: moduleType
}

export function parseModuleTypeId(type: moduleType): bigint {
    switch (type) {
        case "validation":
            return BigInt(1)
        case "execution":
            return BigInt(2)
        case "fallback":
            return BigInt(3)
        case "hooks":
            return BigInt(4)
        default:
            throw new Error("Invalid module type")
    }
}

export async function supportsModule<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    args: Prettify<SupportsModuleParameters<TEntryPoint, TSmartAccount>>
): Promise<boolean> {
    const { account: account_ = client.account } = args

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

    const publicClient = account.client

    /**
     * TODO: counterfactual
     */
    return publicClient.readContract({
        abi: [
            {
                name: "supportsModule",
                type: "function",
                stateMutability: "view",
                inputs: [
                    {
                        type: "uint256",
                        name: "moduleTypeId"
                    }
                ],
                outputs: [
                    {
                        type: "bool"
                    }
                ]
            }
        ],
        functionName: "supportsModule",
        args: [parseModuleTypeId(args.type)],
        address: account.address
    })
}
