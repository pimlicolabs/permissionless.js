import { Actions, type Chain, ContractError } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import {
    AbiFunction,
    AbiParameters,
    type Address,
    Bytes,
    Hex
} from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { GetSmartAccountParameter } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"

export type CallType = "call" | "delegatecall" | "batchcall"

export type ExecutionMode<callType extends CallType> = {
    type: callType
    revertOnError?: boolean
    selector?: Hex.Hex
    context?: Hex.Hex
}

export type SupportsExecutionModeParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined,
    callType extends CallType = CallType
> = GetSmartAccountParameter<TSmartAccount> & ExecutionMode<callType>

export function getCallType(callType: CallType) {
    switch (callType) {
        case "call":
            return "0x00"
        case "batchcall":
            return "0x01"
        case "delegatecall":
            return "0xff"
    }
}

const toSizedHex = (value: Hex.Hex, size: number) =>
    Hex.fromBytes(Bytes.fromHex(value, { size }))

export function encodeExecutionMode<callType extends CallType>({
    type,
    revertOnError,
    selector,
    context
}: ExecutionMode<callType>): Hex.Hex {
    return AbiParameters.encodePacked(
        ["bytes1", "bytes1", "bytes4", "bytes4", "bytes22"],
        [
            toSizedHex(getCallType(type), 1),
            toSizedHex(revertOnError ? "0x01" : "0x00", 1),
            toSizedHex("0x0", 4),
            toSizedHex(selector ?? "0x", 4),
            toSizedHex(context ?? "0x", 22)
        ]
    )
}

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

export async function supportsExecutionMode<
    TSmartAccount extends SmartAccount.SmartAccount | undefined,
    callType extends CallType = CallType
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TSmartAccount>,
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

    const account = account_ as SmartAccount.SmartAccount

    const publicClient = account.client

    const encodedMode = encodeExecutionMode({
        type,
        revertOnError,
        selector,
        context
    })

    try {
        return await getAction(
            publicClient,
            Actions.contract.read,
            "contract.read"
        )({
            abi,
            functionName: "supportsExecutionMode",
            args: [encodedMode],
            address: account.address
        })
    } catch (error) {
        if (error instanceof ContractError.ContractFunctionExecutionError) {
            const { factory, factoryData } = await account.getFactoryArgs()

            const result = await getAction(
                publicClient,
                Actions.call,
                "call"
            )({
                factory: factory as Address.Address | undefined,
                factoryData: factoryData,
                to: account.address,
                data: AbiFunction.encodeData(abi, "supportsExecutionMode", [
                    encodedMode
                ])
            })

            if (!result?.data) {
                throw new Error("accountId result is empty")
            }

            return AbiFunction.decodeResult(
                abi,
                "supportsExecutionMode",
                result.data
            )
        }

        throw error
    }
}
