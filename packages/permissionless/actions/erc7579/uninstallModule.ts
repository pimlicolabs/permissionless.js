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

export type UninstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address
    context: Hex
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
}

export async function uninstallModule<
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: UninstallModuleParameters<TSmartAccount>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        address,
        context
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
        calls: [
            {
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
                    args: [
                        parseModuleTypeId(parameters.type),
                        getAddress(address),
                        context
                    ]
                })
            }
        ],
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account: account
    })
}
