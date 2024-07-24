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

export type InstallModulesParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined
> = GetAccountParameter<TEntryPoint, TSmartAccount> &
    Middleware<TEntryPoint> & {
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
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    parameters: Prettify<InstallModulesParameters<TEntryPoint, TSmartAccount>>
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

    const installModulesCallData = await account.encodeCallData(
        await Promise.all(
            modules.map(({ type, address, context }) => ({
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
            maxFeePerGas: maxFeePerGas || BigInt(0),
            maxPriorityFeePerGas: maxPriorityFeePerGas || BigInt(0),
            callData: installModulesCallData,
            nonce: nonce ? BigInt(nonce) : undefined
        },
        account: account,
        middleware
    })
}
