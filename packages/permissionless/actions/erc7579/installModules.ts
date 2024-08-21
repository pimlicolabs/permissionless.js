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
import { AccountNotFoundError } from "../../errors"
import { parseAccount } from "../../utils/"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type InstallModulesParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    modules: {
        type: ModuleType
        address: Address
        context: Hex
    }[]
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
}

export async function installModules<
    TSmartAccount extends SmartAccount | undefined
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    parameters: InstallModulesParameters<TSmartAccount>
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
                args: [parseModuleTypeId(type), getAddress(address), context]
            })
        })),
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        account: account
    })
}
