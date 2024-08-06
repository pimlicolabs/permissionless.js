import {
    type Address,
    type CallParameters,
    type Chain,
    type Client,
    ContractFunctionExecutionError,
    type Hex,
    type Transport,
    decodeFunctionResult,
    encodeFunctionData,
    getAddress
} from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type IsModuleInstalledParameters<
    TEntryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSmartAccount extends
        | SmartAccount<TEntryPoint, string, TTransport, TChain>
        | undefined =
        | SmartAccount<TEntryPoint, string, TTransport, TChain>
        | undefined
> = GetAccountParameter<TEntryPoint, TTransport, TChain, TSmartAccount> & {
    type: ModuleType
    address: Address
    context: Hex
}

export async function isModuleInstalled<
    TEntryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSmartAccount extends
        | SmartAccount<TEntryPoint, string, TTransport, TChain>
        | undefined =
        | SmartAccount<TEntryPoint, string, TTransport, TChain>
        | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    parameters: IsModuleInstalledParameters<
        TEntryPoint,
        TTransport,
        TChain,
        TSmartAccount
    >
): Promise<boolean> {
    const { account: account_ = client.account, address, context } = parameters

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<
        TEntryPoint,
        string,
        TTransport,
        TChain
    >

    const publicClient = account.client

    const abi = [
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
    ] as const

    try {
        return await publicClient.readContract({
            abi,
            functionName: "isModuleInstalled",
            args: [
                parseModuleTypeId(parameters.type),
                getAddress(address),
                context
            ],
            address: account.address
        })
    } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
            const factory = await account.getFactory()
            const factoryData = await account.getFactoryData()

            const result = await publicClient.call({
                factory: factory,
                factoryData: factoryData,
                to: account.address,
                data: encodeFunctionData({
                    abi,
                    functionName: "isModuleInstalled",
                    args: [
                        parseModuleTypeId(parameters.type),
                        getAddress(address),
                        context
                    ]
                })
            } as unknown as CallParameters<TChain>)

            if (!result || !result.data) {
                throw new Error("accountId result is empty")
            }

            return decodeFunctionResult({
                abi,
                functionName: "isModuleInstalled",
                data: result.data
            })
        }

        throw error
    }
}
