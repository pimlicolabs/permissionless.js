import type { Chain, Client, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"

export type moduleType = "validation" | "execution" | "fallback" | "hooks"

export type SupportsModuleParameters<
    entryPoint extends EntryPoint,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = GetAccountParameter<entryPoint, TAccount> & {
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
    entryPoint extends EntryPoint,
    TChain extends Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    args: Prettify<SupportsModuleParameters<entryPoint>>
): Promise<boolean> {
    const { account: account_ = client.account } = args

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<entryPoint>

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
