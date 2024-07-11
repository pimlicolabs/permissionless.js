import {
    type Chain,
    type Client,
    ContractFunctionExecutionError,
    type Hex,
    type Transport,
    decodeFunctionResult,
    encodeFunctionData,
    encodePacked,
    toBytes,
    toHex
} from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { GetAccountParameter, Prettify } from "../../types/"
import type { EntryPoint } from "../../types/entrypoint"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"

export type CallType = "call" | "delegatecall" | "batchcall"

export type ExecutionMode<callType extends CallType> = {
    type: callType
    revertOnError?: boolean
    selector?: Hex
    context?: Hex
}

export type SupportsExecutionModeParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined,
    callType extends CallType = CallType
> = GetAccountParameter<TEntryPoint, TSmartAccount> & ExecutionMode<callType>

function parseCallType(callType: CallType) {
    switch (callType) {
        case "call":
            return "0x00"
        case "batchcall":
            return "0x01"
        case "delegatecall":
            return "0xff"
    }
}

export function encodeExecutionMode<callType extends CallType>({
    type,
    revertOnError,
    selector,
    context
}: ExecutionMode<callType>): Hex {
    return encodePacked(
        ["bytes1", "bytes1", "bytes4", "bytes4", "bytes22"],
        [
            toHex(toBytes(parseCallType(type), { size: 1 })),
            toHex(toBytes(revertOnError ? "0x01" : "0x00", { size: 1 })),
            toHex(toBytes("0x0", { size: 4 })),
            toHex(toBytes(selector ?? "0x", { size: 4 })),
            toHex(toBytes(context ?? "0x", { size: 22 }))
        ]
    )
}

export async function supportsExecutionMode<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, TSmartAccount>,
    args: Prettify<SupportsExecutionModeParameters<TEntryPoint, TSmartAccount>>
): Promise<boolean> {
    const {
        account: account_ = client.account,
        type,
        revertOnError,
        selector,
        context
    } = args

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

    const publicClient = account.client

    const encodedMode = encodeExecutionMode({
        type,
        revertOnError,
        selector,
        context
    })

    const abi = [
        {
            name: "supportsExecutionMode",
            type: "function",
            stateMutability: "view",
            inputs: [
                {
                    type: "bytes32",
                    name: "encodedMode"
                }
            ],
            outputs: [
                {
                    type: "bool"
                }
            ]
        }
    ] as const

    try {
        return await publicClient.readContract({
            abi,
            functionName: "supportsExecutionMode",
            args: [encodedMode],
            address: account.address
        })
    } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
            const factory = await account.getFactory()
            const factoryData = await account.getFactoryData()

            const result = await publicClient.call({
                factory: factory,
                factoryData: factoryData,
                to: account.address,
                data: encodeFunctionData({
                    abi,
                    functionName: "supportsExecutionMode",
                    args: [encodedMode]
                })
            })

            if (!result || !result.data) {
                throw new Error("accountId result is empty")
            }

            return decodeFunctionResult({
                abi,
                functionName: "supportsExecutionMode",
                data: result.data
            })
        }

        throw error
    }
}
