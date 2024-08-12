import {
    type CallParameters,
    type Chain,
    type Client,
    ContractFunctionExecutionError,
    type Transport,
    decodeFunctionResult,
    encodeFunctionData
} from "viem"
import { call, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter } from "../../types"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"

export async function accountId<
    TEntryPoint extends EntryPoint,
    TTransport extends Transport,
    TChain extends Chain | undefined,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    args?: GetAccountParameter<TEntryPoint, TSmartAccount>
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

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

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
            address: account.address
        })
    } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
            const factory = await account.getFactory()
            const factoryData = await account.getFactoryData()

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
            } as unknown as CallParameters<TChain>)

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
