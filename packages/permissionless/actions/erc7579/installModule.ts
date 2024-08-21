import {
    type Address,
    type Client,
    type Hex,
    encodeFunctionData,
    getAddress
} from "viem"
import {
    type GetSmartAccountParameter,
    type SmartAccount,
    sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { AccountNotFoundError } from "../../errors"
import { parseAccount } from "../../utils/"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type InstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address
    context: Hex
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
}

export async function installModule<
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client,
    parameters: InstallModuleParameters<TSmartAccount>
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
                            name: "installModule",
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
                                    name: "initData"
                                }
                            ],
                            outputs: []
                        }
                    ],
                    functionName: "installModule",
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
        account
    })
}
