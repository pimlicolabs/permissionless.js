import { encodeFunctionData } from "viem"

export const encodeCallData = async (
    calls: readonly {
        to: `0x${string}`
        value?: bigint | undefined
        data?: `0x${string}` | undefined
    }[]
) => {
    if (calls.length > 1) {
        return encodeFunctionData({
            abi: [
                {
                    inputs: [
                        {
                            internalType: "address[]",
                            name: "dest",
                            type: "address[]"
                        },
                        {
                            internalType: "uint256[]",
                            name: "value",
                            type: "uint256[]"
                        },
                        {
                            internalType: "bytes[]",
                            name: "func",
                            type: "bytes[]"
                        }
                    ],
                    name: "executeBatch",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function"
                }
            ],
            functionName: "executeBatch",
            args: [
                calls.map((a) => a.to),
                calls.map((a) => a.value ?? 0n),
                calls.map((a) => a.data ?? "0x")
            ]
        })
    }

    const call = calls.length === 0 ? undefined : calls[0]

    if (!call) {
        throw new Error("No calls to encode")
    }

    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "dest",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "value",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "func",
                        type: "bytes"
                    }
                ],
                name: "execute",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "execute",
        args: [call.to, call.value ?? 0n, call.data ?? "0x"]
    })
}
