import {
    type Address,
    type Client,
    type Hex,
    encodeFunctionData,
    getAddress
} from "viem"
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import type { Middleware } from "../smartAccount/prepareUserOperationRequest"
import {
    type SendUserOperationParameters,
    sendUserOperation
} from "../smartAccount/sendUserOperation"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type InstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    type: ModuleType
    address: Address
    context: Hex
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
} & Middleware<TEntryPoint>

export async function installModule<
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    client: Client,
    parameters: Prettify<InstallModuleParameters<TSmartAccount>>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        middleware,
        address,
        context
    } = parameters

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

    const installModuleCallData = await account.encodeCallData({
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
    })

    return getAction(
        client,
        sendUserOperation<TEntryPoint, TTransport, TChain, TSmartAccount>,
        "sendUserOperation"
    )({
        userOperation: {
            sender: account.address,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            callData: installModuleCallData,
            nonce: nonce
        },
        account: account,
        middleware
    } as SendUserOperationParameters<TEntryPoint, TSmartAccount>)
}
