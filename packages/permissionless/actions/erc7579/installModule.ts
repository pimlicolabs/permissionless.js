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

export type InstallModuleParameters<
    entryPoint extends EntryPoint,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = GetAccountParameter<entryPoint, TAccount> & {
    type: moduleType
    address: Address
    callData: Hex
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
} & Middleware<entryPoint>

export async function installModule<
    entryPoint extends EntryPoint,
    TChain extends Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    parameters: Prettify<InstallModuleParameters<entryPoint>>
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

    const account = parseAccount(account_) as SmartAccount<entryPoint>

    const installModuleCallData = encodeFunctionData({
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
        args: [parseModuleTypeId(parameters.type), address, callData]
    })

    return getAction(
        client,
        sendUserOperation<entryPoint>,
        "sendUserOperation"
    )({
        userOperation: {
            sender: account.address,
            maxFeePerGas: maxFeePerGas || BigInt(0),
            maxPriorityFeePerGas: maxPriorityFeePerGas || BigInt(0),
            callData: installModuleCallData,
            nonce: nonce ? BigInt(nonce) : undefined
        },
        account: account,
        middleware
    })
}
