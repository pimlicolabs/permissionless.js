import {
    type CallParameters,
    type Chain,
    type Client,
    ContractFunctionExecutionError,
    type Transport,
    decodeFunctionResult,
    encodeFunctionData
} from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"

export type ModuleType = "validator" | "executor" | "fallback" | "hook"

export type SupportsModuleParameters<
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
}

export function parseModuleTypeId(type: ModuleType): bigint {
    switch (type) {
        case "validator":
            return BigInt(1)
        case "executor":
            return BigInt(2)
        case "fallback":
            return BigInt(3)
        case "hook":
            return BigInt(4)
        default:
            throw new Error("Invalid module type")
    }
}

export async function supportsModule<
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
    args: Prettify<
        SupportsModuleParameters<TEntryPoint, TTransport, TChain, TSmartAccount>
    >
): Promise<boolean> {
    const { account: account_ = client.account } = args

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
    ] as const

    try {
        return await publicClient.readContract({
            abi,
            functionName: "supportsModule",
            args: [parseModuleTypeId(args.type)],
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
                    functionName: "supportsModule",
                    args: [parseModuleTypeId(args.type)]
                })
            } as unknown as CallParameters<TChain>)

            if (!result || !result.data) {
                throw new Error("accountId result is empty")
            }

            return decodeFunctionResult({
                abi,
                functionName: "supportsModule",
                data: result.data
            })
        }

        throw error
    }
}
