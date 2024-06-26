import {
    type Chain,
    type Client,
    type Hex,
    type Transport,
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

export type ExecutionMode = {
    callType: CallType
    revertOnError: boolean
    modeSelector: Hex
    modeData: Hex
}

export type SupportsExecutionModeParameters<
    TEntryPoint extends EntryPoint,
    TSmartAccount extends SmartAccount<TEntryPoint> | undefined =
        | SmartAccount<TEntryPoint>
        | undefined
> = GetAccountParameter<TEntryPoint, TSmartAccount> & ExecutionMode

function parseCallType(executionMode: CallType) {
    switch (executionMode) {
        case "call":
            return "0x00"
        case "delegatecall":
            return "0x01"
        case "batchcall":
            return "0xff"
    }
}

export function encodeExecutionMode({
    callType,
    revertOnError,
    modeSelector,
    modeData
}: ExecutionMode): Hex {
    return encodePacked(
        ["bytes1", "bytes1", "bytes4", "bytes4", "bytes22"],
        [
            toHex(toBytes(parseCallType(callType), { size: 1 })),
            toHex(toBytes(revertOnError ? "0x01" : "0x00", { size: 1 })),
            toHex(toBytes("0x0", { size: 4 })),
            toHex(toBytes(modeSelector, { size: 4 })),
            toHex(toBytes(modeData, { size: 22 }))
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
        callType,
        revertOnError,
        modeSelector,
        modeData
    } = args

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount<TEntryPoint>

    const publicClient = account.client

    const encodedMode = encodeExecutionMode({
        callType,
        revertOnError,
        modeSelector,
        modeData
    })

    /**
     * TODO: counterfactual
     */
    return publicClient.readContract({
        abi: [
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
        ],
        functionName: "supportsExecutionMode",
        args: [encodedMode],
        address: account.address
    })
}
