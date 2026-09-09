import { Actions, type Chain, ContractError } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import { AbiFunction, Address, type Hex } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { GetSmartAccountParameter, OneOf } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import { type ModuleType, parseModuleTypeId } from "./supportsModule.js"

export type IsModuleInstalledParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address.Address
} & OneOf<
        | {
              additionalContext: Hex.Hex
          }
        | {
              context: Hex.Hex
          }
    >

const abi = [
    {
        type: "function",
        name: "isModuleInstalled",
        inputs: [
            {
                name: "moduleType",
                type: "uint256",
                internalType: "uint256"
            },
            { name: "module", type: "address", internalType: "address" },
            {
                name: "additionalContext",
                type: "bytes",
                internalType: "bytes"
            }
        ],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
        stateMutability: "view"
    }
] as const

export async function isModuleInstalled<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
    parameters: IsModuleInstalledParameters<TSmartAccount>
): Promise<boolean> {
    const {
        account: account_ = client.account,
        address,
        context,
        additionalContext
    } = parameters

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = account_ as SmartAccount.SmartAccount

    const publicClient = account.client

    const args = [
        parseModuleTypeId(parameters.type),
        Address.checksum(address),
        (context ?? additionalContext) as Hex.Hex
    ] as const

    try {
        return await getAction(
            publicClient,
            Actions.contract.read,
            "contract.read"
        )({
            abi,
            functionName: "isModuleInstalled",
            args,
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
                data: AbiFunction.encodeData(abi, "isModuleInstalled", args)
            })

            if (!result?.data) {
                throw new Error("accountId result is empty")
            }

            return AbiFunction.decodeResult(
                abi,
                "isModuleInstalled",
                result.data
            )
        }

        throw error
    }
}
