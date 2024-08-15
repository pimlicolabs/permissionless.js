import {
    type Client,
    ContractFunctionExecutionError,
    decodeFunctionResult,
    encodeFunctionData
} from "viem"
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import { call, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"

export async function accountId<
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    client: Client,
    args?: GetSmartAccountParameter<TSmartAccount>
): Promise<string> {
    let account_ = client.account

    if (args) {
        account_ = args.account as TSmartAccount
    }

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = account_ as SmartAccount

    const publicClient = account.client

    const abi = [
        {
            name: "accountId",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [
                {
                    type: "string",
                    name: "accountImplementationId"
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
            functionName: "accountId",
            address: await account.getAddress()
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
                    functionName: "accountId"
                })
            })

            if (!result || !result.data) {
                throw new Error("accountId result is empty")
            }

            return decodeFunctionResult({
                abi,
                functionName: "accountId",
                data: result.data
            })
        }

        throw error
    }
}
