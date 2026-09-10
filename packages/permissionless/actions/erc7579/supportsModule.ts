import { Actions, type Chain, ContractError } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import { AbiFunction, type Address } from "viem/utils"
import { AccountNotFoundError } from "../../errors/account.js"
import { Erc7579InvalidModuleTypeError } from "../../errors/erc7579.js"
import type { GetSmartAccountParameter } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"

export type ModuleType = "validator" | "executor" | "fallback" | "hook"

export type SupportsModuleParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
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
            throw new Erc7579InvalidModuleTypeError({ type })
    }
}

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

export async function supportsModule<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    args: SupportsModuleParameters<TSmartAccount>
): Promise<boolean> {
    const { account: account_ = client.account } = args

    if (!account_) {
        throw new AccountNotFoundError()
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
            functionName: "supportsModule",
            args: [parseModuleTypeId(args.type)],
            address: account.address
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
                data: AbiFunction.encodeData(abi, "supportsModule", [
                    parseModuleTypeId(args.type)
                ])
            })

            if (!result?.data) {
                throw new ContractError.ContractFunctionZeroDataError({
                    functionName: "supportsModule"
                })
            }

            return AbiFunction.decodeResult(abi, "supportsModule", result.data)
        }

        throw error
    }
}
