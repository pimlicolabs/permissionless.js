import type { Address, Chain, Client, Hex, Transport } from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import { type moduleType, parseModuleTypeId } from "./supportsModule"

export type IsModuleInstalledParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined
> = GetAccountParameter<TEntryPoint, TSmartAccount> & {
    type: moduleType
    address: Address
    callData: Hex
}

export async function isModuleInstalled<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    parameters: IsModuleInstalledParameters<TEntryPoint, TSmartAccount>
): Promise<boolean> {
    const { account: account_ = client.account, address, callData } = parameters

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
