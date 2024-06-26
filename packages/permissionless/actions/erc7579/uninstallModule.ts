import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport,
    encodeFunctionData
} from "viem"
import { getAction } from "viem/utils"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import type { Middleware } from "../smartAccount/prepareUserOperationRequest"
import { sendUserOperation } from "../smartAccount/sendUserOperation"
import { type moduleType, parseModuleTypeId } from "./supportsModule"

export type UninstallModuleParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined
> = GetAccountParameter<TEntryPoint, TSmartAccount> & {
    type: moduleType
    address: Address
    callData: Hex
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
} & Middleware<TEntryPoint>

export async function uninstallModule<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    parameters: Prettify<UninstallModuleParameters<TEntryPoint, TSmartAccount>>
): Promise<Hex> {
    const {
        account: account_ = client.account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        middleware,
        address,
        callData
    } = parameters

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

    const uninstallModuleCallData = encodeFunctionData({
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
        args: [parseModuleTypeId(parameters.type), address, callData]
    })

    return getAction(
        client,
        sendUserOperation<TEntryPoint>,
        "sendUserOperation"
    )({
        userOperation: {
            sender: account.address,
            maxFeePerGas: maxFeePerGas || BigInt(0),
            maxPriorityFeePerGas: maxPriorityFeePerGas || BigInt(0),
            callData: uninstallModuleCallData,
            nonce: nonce ? BigInt(nonce) : undefined
        },
        account: account,
        middleware
    })
}
