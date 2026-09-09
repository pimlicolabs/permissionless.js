import { Actions, type Chain, ContractError } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import { AbiFunction, type Address } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { GetSmartAccountParameter } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"

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

export async function accountId<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    args?: GetSmartAccountParameter<TSmartAccount>
): Promise<string> {
    let account_ = client.account

    if (args) {
        account_ = args.account as TSmartAccount
    }

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = account_ as SmartAccount.SmartAccount

    const publicClient = account.client

    try {
        return await getAction(
            publicClient,
            Actions.contract.read,
            "contract.read"
        )({
            abi,
            functionName: "accountId",
            address: await account.getAddress()
        })
    } catch (error) {
        if (error instanceof ContractError.ContractFunctionExecutionError) {
            const { factory, factoryData } = await account.getFactoryArgs()

            const result = await getAction(
                publicClient,
                Actions.call,
                "call"
            )({
                factory: factory as Address.Address | undefined,
                factoryData: factoryData,
                to: account.address,
                data: AbiFunction.encodeData(abi, "accountId")
            })

            if (!result?.data) {
                throw new Error("accountId result is empty")
            }

            return AbiFunction.decodeResult(abi, "accountId", result.data)
        }

        throw error
    }
}
