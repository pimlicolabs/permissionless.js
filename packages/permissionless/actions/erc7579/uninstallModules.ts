import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport,
    encodeFunctionData,
    getAddress
} from "viem"
import {
    type GetSmartAccountParameter,
    type SmartAccount,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type UninstallModulesParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    modules: [
        {
            type: ModuleType
            address: Address
            context: Hex
        }
    ]
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
}

export async function uninstallModules<
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: UninstallModulesParameters<TSmartAccount>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        modules
    } = parameters

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

    return getAction(
        client,
        sendUserOperation,
        "sendUserOperation"
    )({
        calls: modules.map(({ type, address, context }) => ({
            to: account.address,
            value: BigInt(0),
            data: encodeFunctionData({
                abi: [
                    {
                        name: "uninstallModule",
                        type: "function",
                        stateMutability: "nonpayable",
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
                                name: "deInitData"
                            }
                        ],
                        outputs: []
                    }
                ],
                functionName: "uninstallModule",
                args: [parseModuleTypeId(type), getAddress(address), context]
            })
        })),
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account
    })
}
