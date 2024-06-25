import type { Address, Chain, Client, Hex, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import type { Middleware } from "../smartAccount/prepareUserOperationRequest"
import { type moduleType, parseModuleTypeId } from "./supportsModule"

export type IsModuleInstalledParameters<
    entryPoint extends EntryPoint,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = GetAccountParameter<entryPoint, TAccount> & {
    type: moduleType
    address: Address
    callData: Hex
} & Middleware<entryPoint>

export async function isModuleInstalled<
    entryPoint extends EntryPoint,
    TChain extends Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    parameters: Prettify<IsModuleInstalledParameters<entryPoint>>
): Promise<boolean> {
    const { account: account_ = client.account, address, callData } = parameters

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
                name: "isModuleInstalled",
                type: "function",
                stateMutability: "view",
                inputs: [
                    {
                        type: "uint256",
                        name: "moduleTypeId"
                    },
                    {
                        type: "address",
                        name: "module"
                    },
                    {
                        type: "bytes",
                        name: "additionalContext"
                    }
                ],
                outputs: [
                    {
                        type: "bool"
                    }
                ]
            }
        ],
        functionName: "isModuleInstalled",
        args: [parseModuleTypeId(parameters.type), address, callData],
        address: account.address
    })
}
