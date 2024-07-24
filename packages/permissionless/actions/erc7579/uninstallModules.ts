import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport,
    encodeFunctionData,
    getAddress
} from "viem"
import { getAction } from "viem/utils"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import type { Middleware } from "../smartAccount/prepareUserOperationRequest"
import { sendUserOperation } from "../smartAccount/sendUserOperation"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type UninstallModulesParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined
> = GetAccountParameter<TEntryPoint, TSmartAccount> & {
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
} & Middleware<TEntryPoint>

export async function uninstallModules<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    parameters: Prettify<UninstallModulesParameters<TEntryPoint, TSmartAccount>>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        middleware,
        modules
    } = parameters

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

    const uninstallModulesCallData = await account.encodeCallData(
        await Promise.all(
            modules.map(({ type, address, context }) => ({
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
                        parseModuleTypeId(type),
                        getAddress(address),
                        context
                    ]
                })
            }))
        )
    )

    return getAction(
        client,
        sendUserOperation<TEntryPoint>,
        "sendUserOperation"
    )({
        userOperation: {
            sender: account.address,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            callData: uninstallModulesCallData,
            nonce: nonce
        },
        account: account,
        middleware
    })
}