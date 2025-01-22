import { type Address, type Hex, decodeFunctionData } from "viem"

export const decodeCallData = async (callData: `0x${string}`) => {
    try {
        const decodedBatch = decodeFunctionData({
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
            data: callData
        })

        const calls: {
            to: Address
            data: Hex
            value?: bigint
        }[] = []

        for (let i = 0; i < decodedBatch.args[0].length; i++) {
            calls.push({
                to: decodedBatch.args[0][i],
                value: decodedBatch.args[1][i],
                data: decodedBatch.args[2][i]
            })
        }

        return calls
    } catch (_) {}

    const decodedSingle = decodeFunctionData({
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
        data: callData
    })

    return [
        {
            to: decodedSingle.args[0],
            value: decodedSingle.args[1],
            data: decodedSingle.args[2]
        }
    ]
}
