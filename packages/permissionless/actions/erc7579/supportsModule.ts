import {
    type Chain,
    type Client,
    ContractFunctionExecutionError,
    type Transport,
    decodeFunctionResult,
    encodeFunctionData
} from "viem"
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import { call, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"

export type ModuleType = "validator" | "executor" | "fallback" | "hook"

export type SupportsModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
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
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    args: SupportsModuleParameters<TSmartAccount>
): Promise<boolean> {
    const { account: account_ = client.account } = args

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

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
        return await getAction(
            publicClient,
            readContract,
            "readContract"
        )({
            abi,
            functionName: "supportsModule",
            args: [parseModuleTypeId(args.type)],
            address: account.address
        })
    } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
            const { factory, factoryData } = await account.getFactoryArgs()

            const result = await getAction(
                publicClient,
                call,
                "call"
            )({
                factory: factory,
                factoryData: factoryData,
                to: account.address,
                data: encodeFunctionData({
                    abi,
                    functionName: "supportsModule",
                    args: [parseModuleTypeId(args.type)]
                })
            })

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
