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
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import { call, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"

export type CallType = "call" | "delegatecall" | "batchcall"

export type ExecutionMode<callType extends CallType> = {
    type: callType
    revertOnError?: boolean
    selector?: Hex
    context?: Hex
}

export type SupportsExecutionModeParameters<
    TSmartAccount extends SmartAccount | undefined,
    callType extends CallType = CallType
> = GetSmartAccountParameter<TSmartAccount> & ExecutionMode<callType>

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
    TSmartAccount extends SmartAccount | undefined,
    callType extends CallType = CallType
>(
    client: Client<Transport, Chain | undefined, TSmartAccount>,
    args: SupportsExecutionModeParameters<TSmartAccount, callType>
): Promise<boolean> {
    const {
        account: account_ = client.account,
        type,
        revertOnError,
        selector,
        context
    } = args

    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

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
        return await getAction(
            publicClient,
            readContract,
            "readContract"
        )({
            abi,
            functionName: "supportsExecutionMode",
            args: [encodedMode],
            address: account.address
        })
    } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
            const { factory, factoryData } = await account.getFactoryArgs()

            const result = await getAction(
                publicClient,
                call,
                "call"
            )({
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
